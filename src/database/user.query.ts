import prisma from './index';
import { User } from '@prisma/client';

export async function getUser(id: number) {
  const user = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });
  return user;
}
