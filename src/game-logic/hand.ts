import { Card } from '@prisma/client';
import { deckGenerate } from './deck';
import { deckCard } from '../../index';

function randomIndex(deck: deckCard[]) {
  return Math.floor(Math.random() * deck.length);
}

export function handInit(players: any, deck: deckCard[]) {
  for (const player in players) {
    players[player].hand = [];
    for (let i = 0; i < 3; i++) {
      const random = randomIndex(deck);
      const card = deck.splice(random, 1)[0];
      players[player].hand.push(card);
    }
  }
  return [players, deck];
}

export async function handAddCard(hand: any, deck: deckCard[]) {
  if (deck.length === 0) {
    deck = await deckGenerate();
  }
  const random = randomIndex(deck);
  const card = deck.splice(random, 1)[0];
  hand.push(card);

  return [hand, deck];
}

export function handRemoveCard(hand: any) {
  const randIndex = randomIndex(hand);
  hand.splice(randIndex, 1);

  return hand;
}
