import { Request, Response } from 'express';
import express from 'express';
import session, { Session } from 'express-session';
import FS from 'session-file-store';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import { User } from '../index';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();

const FileStore = FS(session);

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};

declare module 'express-session' {
  interface SessionData {
    user: User;
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
app.use(cors(corsOptions));

app.use('/user', userRoutes);

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
  socket.on('create_room', () => {
    const room = String(socket.request.session.user.id);
    socket.join(room);
  });

  socket.on('get_rooms', () => {
    const rooms = sessionSocket.adapter.rooms;
    console.log('roooooms ====>', rooms);
    let roomList: any = [];
    rooms.forEach((value, key) => {
      const users = Array.from(value);
      if (!users.includes(key)) {
        roomList.push([key, users.length]);
      }
    });

    socket.emit('send_rooms', roomList);
  });

  socket.on('join_room', (data) => {
    const room = String(data);
    socket.join(room);
  });
  socket.on('disconnect', (socket) => {
    console.log(`close ${socket}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
