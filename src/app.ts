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

import { mainConnection, chatConnection, sessionConnection } from './websoket';

dotenv.config();

const FileStore = FS(session);

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.100.4:5173/',
  ],
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
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://192.168.100.4:5173',
    ],
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

mainConnection(io);

chatConnection(io);

sessionConnection(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
