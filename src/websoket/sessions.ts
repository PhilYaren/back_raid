import { Server, Socket } from 'socket.io';
import {
  createRoom,
  deleteRoom,
  disconnect,
  joinRoom,
  movePlayer,
  startGame,
} from './listeners/session.listeners';
import {
  battleListener,
  battleState,
  resetActionListener,
} from './listeners/battlestate.listener';

export function sessionConnection(io: Server) {
  const sessionSocket = io.of('/sessions');

  sessionSocket.on('connection', (socket: Socket) => {
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
        await createRoom(sessionSocket, socket, { name, size }, list);
      }
    );

    socket.on('get_rooms', () => {
      const roomList = list();
      sessionSocket.emit('send_rooms', roomList);
    });

    socket.on('join_room', async ({ name }) => {
      await joinRoom(sessionSocket, socket, name, list);
    });

    socket.on('start_game', async (room) => {
      await startGame(sessionSocket, socket, room);
    });

    socket.on('send_message', (data) => {
      const { room, message, user, time } = data;
      sessionSocket.in(room).emit('receive_message', { message, user, time });
    });

    socket.on('move_player', async (data) => {
      await movePlayer(
        sessionSocket,
        socket,
        data.room,
        data.data,
        data.last,
        data.final
      );
    });
    socket.on('action', async (room, data, opponents) => {
      await battleState(sessionSocket, socket, room, data, opponents);
    });

    socket.on('battle', async (room, card, id, color, current) => {
      await battleListener(
        sessionSocket,
        socket,
        room,
        card,
        id,
        color,
        current
      );
    });

    socket.on('reset_battle', async (room) => {
      await resetActionListener(sessionSocket, socket, room);
    });

    socket.on('delete_room', async ({ name }) => {
      await deleteRoom(sessionSocket, socket, name);
    });

    socket.on('disconnect', async (socket) => {
      await disconnect(socket, list);
    });
  });
}
