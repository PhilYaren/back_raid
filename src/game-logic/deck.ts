import prisma from '../database';
import { v4 } from 'uuid';
import { Card } from '@prisma/client';
import { deckCard } from '../../index';

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
    const newCards: deckCard[] = [];
    for (let i = 0; i < 4; i++) {
      newCards.push({ ...fourCard, id: v4() });
    }
    deck.push(...newCards);
  }
  for (const fiveCard of fiveCards) {
    const newCards: deckCard[] = [];
    for (let i = 0; i < 5; i++) {
      newCards.push({ ...fiveCard, id: v4() });
    }
    deck.push(...newCards);
  }
  return deck;
}
