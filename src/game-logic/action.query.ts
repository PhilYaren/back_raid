import prisma from '../database';

export async function updateAction(sessionId: string, action: any) {
  return prisma.sessionData.update({
    where: {
      sessionId,
    },
    data: {
      actionState: action,
    },
  });
}

export async function resetAction(sessionId: string) {
  const action = {
    modal: false,
    color: null,
    opponents: {},
  };
  return prisma.sessionData.update({
    where: {
      sessionId,
    },
    data: {
      actionState: action,
    },
  });
}
