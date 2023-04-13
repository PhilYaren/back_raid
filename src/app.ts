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
import { deckGenerate } from './game-logic';

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
      user?: User;
      passport?: any;
    };
  }
}

const wrap = (middleware: any) => (socket: any, next: any) =>
  middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
  console.log(`connected ${socket.id}`);
  console.log(socket.request.session);
  // console.log(socket.request);
  // socket.on('send_message', (data) => {
  //   io.emit('receive_message', data);
  // });
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
    async ({
      name,
      size,
      password,
    }: {
      name: string;
      size: string;
      password: string;
    }) => {
      const room = name;
      const session = await prisma.sessionData.create({
        data: {
          sessionId: name,
          size: Number(size),
        },
      });
      socket.join(room);
      console.log('session ====>', sessionSocket.adapter.rooms);
      const roomList = list();
      console.log('roomList ====>', roomList);
      socket.emit('join_room', { name: room });
      sessionSocket.emit('send_rooms', roomList);
    }
  );

  socket.on('get_rooms', async () => {
    const roomList = list();
    console.log('roomList ====>', roomList);

    sessionSocket.emit('send_rooms', roomList);
  });

  socket.on('join_room', async ({ name }) => {
    const session = await prisma.sessionData.findFirst({
      where: {
        sessionId: name,
      },
    });
    if (session !== null) {
      const room = sessionSocket.adapter.rooms.get(session.sessionId);
      let size: number = 0;
      if (room) {
        size = room.size;
      }
      if (size !== 0 && size <= session.size) {
        console.log('session.sessionId ====>', session.sessionId);
        socket.join(session.sessionId);
        socket.emit('join_room', { name: session.sessionId });
      }
    }
  });
  socket.on('init_player', (data: any) => {
    const { room, user } = data;
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
