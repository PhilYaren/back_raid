import { Request, Response } from 'express';
import express from 'express';
import session from 'express-session';
import FS from 'session-file-store';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import * as http from 'http';
import wss from './routes/websoket.routes';
dotenv.config();

const FileStore = FS(session);

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(session(sessionConFig));
app.use(cors(corsOptions));

const server = http.createServer(app);

app.locals.wsClients = new Map();

server.on('upgrade', (request: any, socket: any, head: any) => {
  console.log('Parsing session from request...');
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, app.locals.wsClients);
  });
});

app.listen(PORT, () => {
  console.log('Server is running on port 3000');
});
