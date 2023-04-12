import { Request, Response } from 'express';
import express from 'express';
import session from 'express-session';
import FS from 'session-file-store';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import { User } from '../index';
import http from 'http';
import {Server} from 'socket.io';
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`connected ${socket.id}`);
  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  })
})
io.on('close', (socket) => {
  console.log(`close ${socket.id}`);
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(session(sessionConFig));
app.use(cors(corsOptions));

app.use('/user', userRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
