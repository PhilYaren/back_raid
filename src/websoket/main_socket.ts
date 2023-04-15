import { Server, Socket } from 'socket.io';
import { setUser } from './listeners/main.listener';

export function mainConnection(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`connected ${socket.id}`);

    socket.on('set_user', (data) => {
      setUser(socket, data);
    });

    socket.on('disconnect', (socket) => {
      console.log(`close ${socket}`);
    });
  });
}
