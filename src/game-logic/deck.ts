import prisma from '../database';
import { v4 } from 'uuid';
import { Card } from '@prisma/client';

export async function deckGenerate() {
  const four = [
    '/img/hunter.jpg',
    '/img/witch.jpg',
    '/img/wolf.jpg',
    '/img/beast.jpg',
    '/img/police.jpg',
  ];
  const five = [
    '/img/bonaparte.jpg',
    '/img/Professor.jpg',
    '/img/dwarf.jpg',
    '/img/mermaid.jpg',
    '/img/licho.jpg',
    '/img/robber.jpg',
    '/img/sailor.jpg',
    '/img/mirror.jpg',
    '/img/mummy.jpg',
  ];
  const fiveCards = await prisma.card.findMany({
    where: {
      image: {
        in: five,
      },
    },
  });
  const fourCards = await prisma.card.findMany({
    where: {
      image: {
        in: four,
      },
    },
  });
  const deck = [];
  for (const fourCard of fourCards) {
    const newCard: Card & { unique: string } = { ...fourCard, unique: v4() };
    deck.push(...[newCard, newCard, newCard, newCard]);
  }
  for (const fiveCard of fiveCards) {
    const newCard: Card & { unique: string } = { ...fiveCard, unique: v4() };
    deck.push(...[newCard, newCard, newCard, newCard, newCard]);
  }
  return deck;
}
