import { createTRPCRouter } from '../../trpc'
import { comments } from './comments'
import { createComment } from './createComment'
import { deleteComment } from './deleteComment'
import { updateComment } from './updateComment'

export const commentRouter = createTRPCRouter({
  createComment,
  updateComment,
  deleteComment,
  comments,
})
