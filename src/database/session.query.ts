import prisma from './index';
import { Prisma } from '@prisma/client';

export async function sessionCreate(
  name: string,
  size: string,
  state: Prisma.JsonObject
) {
  return prisma.sessionData.create({
    data: {
      sessionId: name,
      size: Number(size),
      state: state,
    },
  });
}

export async function getSession(name: string) {
  return prisma.sessionData.findFirst({
    where: {
      sessionId: name,
    },
  });
}

export async function updateState(name: string, state: Prisma.JsonObject) {
  return prisma.sessionData.update({
    where: {
      sessionId: name,
    },
    data: {
      state: state,
    },
  });
}

export async function deleteSession(name: string) {
  return prisma.sessionData.delete({
    where: {
      sessionId: name,
    },
  });
}

export async function deleteEmptyRooms(rooms: Array<string>) {
  return prisma.sessionData.deleteMany({
    where: {
      NOT: {
        sessionId: {
          in: rooms,
        },
      },
    },
  });
}
