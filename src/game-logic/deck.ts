import prisma from '../database';

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
    deck.push(...[fourCard, fourCard, fourCard, fourCard]);
  }
  for (const fiveCard of fiveCards) {
    deck.push(...[fiveCard, fiveCard, fiveCard, fiveCard, fiveCard]);
  }
  return deck;
}
