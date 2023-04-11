import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.createMany({
    data: [{
      cardName: 'cover',
      strength: 0,
      wisdom: 0,
      magic: 0,
      health: 0,
      forward: 0,
      backward: 0,
      image: '/img/cover.jpg'
    }, {
      cardName: 'beast',
      strength: 10,
      wisdom: 10,
      magic: 8,
      health: 6,
      forward: 6,
      backward: 5,
      image: '/img/beast.jpg'
    },
      {
        cardName: 'bonaparte',
        strength: 4,
        wisdom: 14,
        magic: 5,
        health: 11,
        forward: 10,
        backward: 8,
        image: '/img/bonaparte.jpg'
      },
      {
        cardName: 'dwarf',
        strength: 4,
        wisdom: 13,
        magic: 11,
        health: 6,
        forward: 3,
        backward: 5,
        image: '/img/dwarf.jpg'
      },
      {
        cardName: 'hunter',
        strength: 15,
        wisdom: 6,
        magic: 12,
        health: 2,
        forward: 2,
        backward: 3,
        image: '/img/hunter.jpg'
      },
      {
        cardName: 'licho',
        strength: 6,
        wisdom: 12,
        magic: 8,
        health: 9,
        forward: 8,
        backward: 6,
        image: '/img/licho.jpg'
      },
      {
        cardName: 'mermaid',
        strength: 9,
        wisdom: 2,
        magic: 3,
        health: 12,
        forward: 9,
        backward: 6,
        image: '/img/mermaid.jpg'
      },
      {
        cardName: 'mirror',
        strength: 1,
        wisdom: 15,
        magic: 11,
        health: 1,
        forward: 5,
        backward: 4,
        image: '/img/mirror.jpg'
      },
      {
        cardName: 'mummy',
        strength: 2,
        wisdom: 5,
        magic: 14,
        health: 7,
        forward: 6,
        backward: 4,
        image: '/img/mummy.jpg'
      },
      {
        cardName: 'police',
        strength: 11,
        wisdom: 3,
        magic: 10,
        health: 11,
        forward: 7,
        backward: 5,
        image: '/img/police.jpg'
      },
      {
        cardName: 'Professor',
        strength: 7,
        wisdom: 14,
        magic: 4,
        health: 9,
        forward: 5,
        backward: 3,
        image: '/img/Professor.jpg'
      },
      {
        cardName: 'robber',
        strength: 8,
        wisdom: 13,
        magic: 1,
        health: 8,
        forward: 6,
        backward: 10,
        image: '/img/robber.jpg'
      },
      {
        cardName: 'sailor',
        strength: 13,
        wisdom: 3,
        magic: 7,
        health: 8,
        forward: 5,
        backward: 6,
        image: '/img/sailor.jpg'
      },
      {
        cardName: 'witch',
        strength: 12,
        wisdom: 8,
        magic: 13,
        health: 3,
        forward: 5,
        backward: 7,
        image: '/img/witch.jpg'
      },
      {
        cardName: 'wolf',
        strength: 14,
        wisdom: 4,
        magic: 2,
        health: 10,
        forward: 6,
        backward: 9,
        image: '/img/wolf.jpg'
      },
    ]
  })
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
