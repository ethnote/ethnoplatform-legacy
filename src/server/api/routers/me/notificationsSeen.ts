import { protectedProcedure } from '../../trpc'

export const notificationsSeen = protectedProcedure.mutation(
  async ({ ctx }) => {
    const user = await ctx.prisma.user.update({
      where: {
        id: ctx.session.user.id,
      },
      data: {
        notificationsRead: new Date(),
      },
    })

    return user
  },
)
