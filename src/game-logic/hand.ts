import { Card } from '@prisma/client';
import { deckGenerate } from './deck';

function randomIndex(deck: Card[]) {
  return Math.floor(Math.random() * deck.length);
}

export function handInit(players: any, deck: Card[]) {
  for (const player in players) {
    players.player = [];
    for (let i = 0; i < 3; i++) {
      const random = randomIndex(deck);
      const card = deck.splice(random, 1)[0];
      players.player.push(card);
    }
  }
  return players;
}

export async function handAddCard(hand: any, deck: Card[]) {
  if (deck.length === 0) {
    deck = await deckGenerate();
  }
  const random = randomIndex(deck);
  const card = deck.splice(random, 1)[0];
  hand.push(card);

  return hand;
}

export function handRemoveCard(hand: any, card: Card) {
  const index = hand.findIndex((item: Card) => item.id === card.id);
  hand.splice(index, 1);

  return hand;
}
