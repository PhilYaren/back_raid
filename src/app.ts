import { Request, Response } from 'express';
import express from 'express';
import session, { Session } from 'express-session';
import FS from 'session-file-store';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import passportRoutes from './passportJS/passport';
import passport from 'passport';
import { User } from '../index';
import http from 'http';
import { Server } from 'socket.io';
import prisma from './database';
import {
  deckGenerate,
  handInit,
  handAddCard,
  handRemoveCard,
} from './game-logic';
import { Card, Prisma } from '@prisma/client';

dotenv.config();

const FileStore = FS(session);

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};

declare module 'express-session' {
  interface SessionData {
    user?: User;
    passport?: any;
  }
}

const sessionConFig: session.SessionOptions = {
  name: 'auth',
  store: new FileStore(),
  resave: false,
  secret: process.env.SECRET || 'secret',
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  },
};

const PORT: number = Number(process.env.PORT) || 3000;

const app = express();
const sessionMiddleware = session(sessionConFig);
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(sessionMiddleware);
app.use(passport.authenticate('session'));
app.use(cors(corsOptions));

app.use('/user', userRoutes);
app.use('/', passportRoutes);

export const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
});

declare module 'http' {
  interface IncomingMessage {
    session: Session & {
      user: User;
      passport?: any;
    };
  }
}

const wrap = (middleware: any) => (socket: any, next: any) =>
  middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
  console.log(`connected ${socket.id}`);

  socket.on('set_user', (data) => {
    socket.request.session.user = data;
  });

  socket.on('disconnect', (socket) => {
    console.log(`close ${socket}`);
  });
});

const chat = io.of('/chat');
chat.on('connection', (chatSocket) => {
  console.log(`connected ${chatSocket.id}`);

  chatSocket.on('send_message', (data) => {
    console.log(chatSocket.request.session.user);
    chat.emit('receive_message', data);
  });

  chatSocket.on('disconnect', (socket) => {
    console.log(`close ${socket}`);
  });
});

const sessionSocket = io.of('/sessions');

sessionSocket.on('connection', (socket) => {
  function list() {
    const rooms = sessionSocket.adapter.rooms;
    let roomList: any = [];
    rooms.forEach((value, key) => {
      const users = Array.from(value);
      if (!users.includes(key)) {
        roomList.push([key, users.length, socket.request.session.user?.id]);
      }
    });

    return roomList;
  }

  socket.on(
    'create_room',
    async ({ name, size }: { name: string; size: string }) => {
      const room = name;
      const deck: object[] = await deckGenerate();
      const creator = String(socket.request.session.user?.id);

      const state: Prisma.JsonObject = {
        players: {
          [creator]: {
            hand: [],
            position: 1,
          },
        },
        deck: deck,
        messages: [],
      };

      const session = await prisma.sessionData.create({
        data: {
          sessionId: name,
          size: Number(size),
          state: state,
        },
      });

      socket.join(room);
      const roomList = list();
      socket.emit('join_room', { name: room, state: session.state });
      sessionSocket.emit('send_rooms', roomList);
      const message = {
        user: socket.request.session.user.userName,
        message: 'Присоединился к комнате',
        time: new Date().toLocaleTimeString('ru-RU'),
      };
      sessionSocket.in(room).emit('update_state', { state: session.state });
      sessionSocket.in(room).emit('receive_message', message);
    }
  );

  socket.on('get_rooms', async () => {
    const roomList = list();

    sessionSocket.emit('send_rooms', roomList);
  });

  socket.on('join_room', async ({ name }) => {
    const session = await prisma.sessionData.findFirst({
      where: {
        sessionId: name,
      },
    });

    if (session !== null) {
      const state: any = session.state;
      const user = String(socket.request.session.user?.id);
      const json = {
        ...state,
        players: {
          ...state.players,
          [user]: {
            hand: [],
            position: 1,
          },
        },
      };
      const newState = await prisma.sessionData.update({
        where: {
          sessionId: name,
        },
        data: {
          state: json,
        },
      });

      const room = sessionSocket.adapter.rooms.get(session.sessionId);
      let size: number = 0;

      if (room) {
        size = room.size;
      }

      if (size !== 0 && size <= session.size) {
        socket.join(session.sessionId);
        socket.emit('join_room', { name: session.sessionId, state: json });
        const message = {
          user: socket.request.session.user.id,
          message: 'Присоединился к комнате',
          time: new Date().toLocaleTimeString('ru-RU'),
        };
        console.log('state', newState.state);
        sessionSocket
          .in(session.sessionId)
          .emit('update_state', newState.state);
        sessionSocket.in(session.sessionId).emit('receive_message', message);
      }
    }
  });

  socket.on('send_message', (data) => {
    const { room, message, user, time } = data;
    sessionSocket.in(room).emit('receive_message', { message, user, time });
  });

  socket.on('delete_room', async ({ name }) => {
    const session = await prisma.sessionData.findFirst({
      where: {
        sessionId: name,
      },
    });

    if (session) {
      await prisma.sessionData.delete({
        where: {
          sessionId: name,
        },
      });
    }

    sessionSocket.in(name).disconnectSockets(true);
  });

  socket.on('disconnect', async (socket) => {
    const roomsData = list();
    const rooms = roomsData.map((room: any) => room[0]);
    await prisma.sessionData.deleteMany({
      where: {
        NOT: {
          sessionId: {
            in: rooms,
          },
        },
      },
    });
    console.log(`close ${socket}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
