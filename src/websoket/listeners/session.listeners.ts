import { DisconnectReason, Namespace, Server, Socket } from 'socket.io';
import { deckGenerate, handInit } from '../../game-logic';
import { Prisma } from '@prisma/client';
import {
  deleteEmptyRooms,
  deleteSession,
  getSession,
  sessionCreate,
  updateState,
} from '../../database/session.query';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import prisma from '../../database';

export async function createRoom(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  { name, size }: { name: string; size: string },
  list: () => any[]
) {
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
    current: 0,
    order: [creator],
    messages: [],
  };
  const session = await sessionCreate(name, size, state);

  socket.join(room);

  const roomList = list();
  socket.emit('join_room', { name: room, state: session.state });
  server.emit('send_rooms', roomList);
  const message = {
    user: socket.request.session.user.userName,
    message: 'Присоединился к игре',
    time: new Date().toLocaleTimeString(),
  };
  server.in(room).emit('update_state', { state: session.state });
  server.in(room).emit('receive_message', message);
}

export async function joinRoom(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  name: string,
  list: () => any[]
) {
  const session = await getSession(name);
  if (session) {
    const state: any = session.state;
    const user = String(socket.request.session.user?.id);
    let json: any = state;

    if (!state.players.user) {
      json = {
        ...state,
        players: {
          ...state.players,
          [user]: {
            hand: [],
            position: 1,
          },
        },
        order: [...state.order, user],
      };
    }

    const newState = await updateState(name, json);

    const room = server.adapter.rooms.get(session.sessionId);
    let size = 0;

    if (room) {
      size = room.size;
    }

    if (size !== 0 && size <= session.size) {
      socket.join(session.sessionId);
      socket.emit('join_room', { name: session.sessionId, state: json });

      const message = {
        user: socket.request.session.user.userName,
        message: 'Присоединился к комнате',
        time: new Date().toLocaleTimeString('ru-RU'),
      };

      server.in(session.sessionId).emit('update_state', newState.state);
      server.in(session.sessionId).emit('receive_message', message);
    }
  }
}

export async function startGame(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string
) {
  const session: any = await getSession(room);

  const state = session.state;
  const players = state.players;
  const deck = state.deck;

  const [newPlayers, newDeck] = handInit(players, deck);

  const newState = {
    ...state,
    players: newPlayers,
    deck: newDeck,
  };

  const newSession = await updateState(room, newState);

  console.log(newState);

  server.in(room).emit('update_state', newSession.state);
}

export async function deleteRoom(
  server: Namespace,
  socket: Socket,
  name: string
) {
  const session = await getSession(name);
  if (session) {
    await deleteSession(name);
  }
  server.in(name).disconnectSockets(true);
}

export async function disconnect(socket: DisconnectReason, list: () => any[]) {
  const roomList = list();
  const rooms = roomList.map((room) => room[0]);
  await deleteEmptyRooms(rooms);
  console.log(`socket ${socket} closed`);
}

export async function movePlayer(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string,
  data: { id: string; position: number }
) {
  const session = await getSession(room);
  if (session) {
    const state: any = session.state;
    const players = state.players;
    const newPosition = state.players[data.id].position + data.position;

    const newPlayers = {
      ...players,
      [data.id]: {
        ...players[data.id],
        position: newPosition,
      },
    };

    const newState = {
      ...state,
      players: newPlayers,
    };

    const newSession = await updateState(room, newState);

    server.in(room).emit('update_state', newSession.state);
  }
}
