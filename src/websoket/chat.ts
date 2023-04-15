import { Server, Socket } from 'socket.io';

export function chatConnection(io: Server) {
  const chat = io.of('/chat');

  chat.on('connection', (chatSocket: Socket) => {
    console.log(`connected ${chatSocket.id}`);

    chatSocket.on(
      'send_message',
      (data: { user: string; message: string; time: string }) => {
        chat.emit('receive_message', data);
      }
    );

    chatSocket.on('disconnect', (socket) => {
      console.log(`close ${socket}`);
    });
  });
}
