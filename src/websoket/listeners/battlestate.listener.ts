import { Namespace, Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { getSession, updateState } from '../../database/session.query';
import { handAddCard, handRemoveCard } from '../../game-logic';
import { updateAction } from '../../game-logic/action.query';

export async function battleState(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string,
  { color, effect }: { color: string; effect: string | null },
  { current, opponent }: { current: string; opponent: string }
) {
  const session = await getSession(room);
  if (session) {
    const type = {
      red: 'strength',
      green: 'health',
      blue: 'magic',
      yellow: 'wisdow',
      violet: 'steal',
      black: 'backward',
      white: 'forward',
    };

    let state: any = session.state;
    let action: any = session.actionState;

    if (effect === 'heart') {
      const [hand, deck] = await handAddCard(
        state.players[current].hand,
        state.deck
      );
      state = {
        ...state,
        players: {
          ...state.players,
          [current]: {
            ...state.players[current],
            hand,
          },
        },
        deck,
      };

      const newState = await updateState(room, state);
      server.in(room).emit('update_state', newState.state);

      action = {
        ...action,
        modal: true,
        color: color,
        opponents: {
          current: [],
          opponent: [],
        },
      };
      const newAction = await updateAction(room, action);
      console.log('Проверка 1');

      server.in(room).emit('set_modal', action.modal);
      server.in(room).emit('set_color', action.color);
      server.in(room).emit('set_opponents', action.opponents);
    } else if (effect === 'flower') {
      const hand = handRemoveCard(state.players[current].hand);
      state = {
        ...state,
        players: {
          ...state.players,
          [current]: {
            ...state.players[current],
            hand,
          },
        },
      };

      const newState = await updateState(room, state);
      server.in(room).emit('update_state', newState.state);

      action = {
        ...action,
        modal: true,
        color: color,
        opponents: {
          current: [],
          opponent: [],
        },
      };
      const newAction = await updateAction(room, action);
      console.log('Проверка 2');

      server.in(room).emit('set_modal', action.modal);
      server.in(room).emit('set_color', action.color);
      server.in(room).emit('set_opponents', action.opponents);
    } else {
      action = {
        ...action,
        modal: true,
        color: color,
        opponents: {
          current: [],
          opponent: [],
        },
      };
      const newAction = await updateAction(room, action);
      console.log('Проверка 3');

      server.in(room).emit('set_modal', action.modal);
      server.in(room).emit('set_color', action.color);
      server.in(room).emit('set_opponents', action.opponents);
    }
  }
}
