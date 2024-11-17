import { protectedProcedure } from '../../trpc'

export const deleteUser = protectedProcedure.mutation(async ({ ctx }) => {
  const { prisma, session } = ctx
  const userId = session?.user.id

  const deletedUser = await prisma.user.delete({
    where: {
      id: userId,
    },
  })

  return {
    deletedUser,
  }
})
