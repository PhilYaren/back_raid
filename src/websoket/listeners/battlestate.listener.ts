import { Namespace, Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { getSession, updateState } from '../../database/session.query';
import { handAddCard, handRemoveCard } from '../../game-logic';
import { resetAction, updateAction } from '../../game-logic/action.query';
import { deckCard } from '../../../index';
import { stealCard } from '../../game-logic/hand';

export async function battleState(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string,
  { color, effect }: { color: string; effect: string | null },
  { current, opponent }: { current: string; opponent: string }
) {
  const session = await getSession(room);
  if (session) {
    const type: { [key: string]: string } = {
      red: 'strength',
      green: 'health',
      blue: 'magic',
      yellow: 'wisdow',
      violet: 'steal',
      black: 'backward',
      white: 'forward',
    };
    const typeData = type[color];

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
      if (color === 'white') {
        const order = state.order;

        const newCurrent =
          order.length !== state.current + 1 ? state.current + 1 : 0;
        console.log('newCurrent', newCurrent);
        state = {
          ...state,
          current: newCurrent,
        };
      }

      const newState = await updateState(room, state);
      server.in(room).emit('update_state', newState.state);

      if (color !== 'white') {
        action = {
          ...action,
          modal: true,
          color: typeData,
          opponents: {
            [current]: [],
            [opponent]: [],
          },
        };
        const newAction = await updateAction(room, action);
        server.in(room).emit('set_modal', action.modal);
        server.in(room).emit('set_color', action.color);
        server.in(room).emit('set_opponents', action.opponents);
      }
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
        color: typeData,
        opponents: {
          [current]: [],
          [opponent]: [],
        },
      };
      const newAction = await updateAction(room, action);

      server.in(room).emit('set_modal', action.modal);
      server.in(room).emit('set_color', action.color);
      server.in(room).emit('set_opponents', action.opponents);
    } else if (color === 'violet') {
      const current = state.current;
      const order: any = state.order;
      const currentPlayer = order[current];
      const stolenFrom = order.length !== current + 1 ? current + 1 : 0;
      const stolenPlayer = order[stolenFrom];
      if (state.players[stolenPlayer].hand.length > 2) {
        const [newCurrent, newStolen] = stealCard(
          state.players[currentPlayer],
          state.players[stolenPlayer]
        );
        state = {
          ...state,
          players: {
            ...state.players,
            [currentPlayer]: newCurrent,
            [stolenPlayer]: newStolen,
          },
        };
      }
      state = {
        ...state,
        current: stolenFrom,
      };

      await updateState(room, state);

      server.in(room).emit('update_state', state);
    } else if (color === 'black') {
      const blackTiles = [1, 11, 21, 27, 31, 41, 46, 48];
      const pos = state.players[current].position;
      const index = blackTiles.indexOf(pos);
      const order = state.order;
      const newCurrent =
        order.length !== state.current + 1 ? state.current + 1 : 0;
      state = {
        ...state,
        players: {
          ...state.players,
          [current]: {
            ...state.players[current],
            position: blackTiles[index - 1],
          },
        },
        current: newCurrent,
      };
      await updateState(room, state);

      server.in(room).emit('update_state', state);
    } else if (color === 'white') {
      const whiteTiles = [10, 15, 25, 33, 43];
      const pos = state.players[current].position;
      const index = whiteTiles.indexOf(pos);
      const order = state.order;
      const newCurrent =
        order.length !== state.current + 1 ? state.current + 1 : 0;

      state = {
        ...state,
        players: {
          ...state.players,
          [current]: {
            ...state.players[current],
            position: whiteTiles[index + 1],
          },
        },
        current: newCurrent,
      };
      await updateState(room, state);

      server.in(room).emit('update_state', state);
    } else {
      action = {
        ...action,
        modal: true,
        color: typeData,
        opponents: {
          [current]: [],
          [opponent]: [],
        },
      };
      const newAction = await updateAction(room, action);

      server.in(room).emit('set_modal', action.modal);
      server.in(room).emit('set_color', action.color);
      server.in(room).emit('set_opponents', action.opponents);
    }
  }
}

export async function battleListener(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string,
  card: deckCard,
  id: string,
  color: string,
  current: string
) {
  try {
    const session = await getSession(room);
    if (session) {
      const { state, actionState }: { state: any; actionState: any } = session;
      const { players, deck } = state;
      const { modal, opponents, color } = actionState;
      opponents[id].push(card);
      players[id].hand = players[id].hand.filter(
        (crd: any) => crd.id !== card.id
      );

      const submit = Object.values(opponents).every(
        (deck: any) => deck.length === 1
      );
      if (submit) {
        const opponent = Object.keys(opponents).find(
          (key: any) => key !== current
        ) as string;
        const newState = {
          ...state,
          players,
        };
        const newAction = {
          ...actionState,
          opponents,
        };
        await updateState(room, newState);
        await updateAction(room, newAction);
        const success: string = 'Ведущий игрок продвигается вперед!!!';
        const fail: string = 'Ведущий игрок отступает!!!';
        const draw: string = 'В этом бою вы оба выдохлись.';
        const outcome =
          opponents[current][0][color] > opponents[opponent][0][color]
            ? success
            : opponents[current][0][color] < opponents[opponent][0][color]
            ? fail
            : draw;
        let move = 0;
        if (outcome === success) {
          move = opponents[current][0].forward;
        }
        if (outcome === fail) {
          move = opponents[current][0].backward;
        }
        server.in(room).emit('update_state', newState);
        server.in(room).emit('set_opponents', newAction.opponents);
        setTimeout(() => {
          server.in(room).emit('outcome', outcome, move, newState);
        }, 100);
      } else {
        const newState = {
          ...state,
          players,
        };
        const newAction = {
          ...actionState,
          opponents,
        };
        await updateState(room, newState);
        await updateAction(room, newAction);

        server.in(room).emit('update_state', newState);
        server.in(room).emit('set_opponents', newAction.opponents);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export async function resetActionListener(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string
) {
  const session = await getSession(room);
  if (session) {
    const { state, actionState }: { state: any; actionState: any } = session;
    const { opponents } = actionState;
    let { players, deck } = state;

    for (const key in opponents) {
      const [newHand, newDeck] = await handAddCard(players[key].hand, deck);
      players[key].hand = newHand;
      deck = newDeck;
    }
    const newState = {
      ...state,
      players,
    };
    await updateState(room, newState);

    server.in(room).emit('update_state', newState);
  }

  const { actionState: action }: { actionState: any } = await resetAction(room);

  server.in(room).emit('set_modal', action.modal);
  server.in(room).emit('set_color', action.color);
  server.in(room).emit('set_opponents', action.opponents);
}

export async function changeCurrentHandler(
  server: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket,
  room: string
) {
  const session = await getSession(room);
  if (session) {
    const { state }: { state: any } = session;
    const { players, deck } = state;
    const current = state.current;
    const newCurrent =
      state.order.length !== state.current + 1 ? state.current + 1 : 0;
    const newState = {
      ...state,
      current: newCurrent,
    };
    await updateState(room, newState);
    server.in(room).emit('current', newCurrent);
  }
}
