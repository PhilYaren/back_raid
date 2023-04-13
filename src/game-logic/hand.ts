import { Card } from '@prisma/client';

function randomIndex(deck: Card[]) {
  return Math.floor(Math.random() * deck.length);
}

export function handInit(players: any, deck: Card[]) {
  for (const player of players) {
    player.hand = [];
    for (let i = 0; i < 3; i++) {
      const random = randomIndex(deck);
      const card = deck.splice(random, 1)[0];
      player.hand.push(card);
    }
  }
  return players;
}
