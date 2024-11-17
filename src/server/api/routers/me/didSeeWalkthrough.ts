import { protectedProcedure } from '../../trpc'

export const didSeeWalkthrough = protectedProcedure.mutation(
  async ({ ctx }) => {
    const { prisma, session } = ctx
    const userId = session?.user.id

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        didSeeWalkthrough: true,
      },
    })

    return updatedUser
  },
)
