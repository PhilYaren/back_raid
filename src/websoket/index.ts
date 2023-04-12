import { io } from '../app';

io.on('connection', (socket) => {
  console.log(`connected ${socket.id}`);
});

io.on();
