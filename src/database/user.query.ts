import prisma from "./index";

function getUser (id: number) {
  const user = prisma.user.findFirst({
    where: {
      id: id
    },
    include: {
      statistics: true
    }
  })
}
