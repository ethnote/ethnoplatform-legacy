import { createTRPCRouter } from '../../trpc'
import { createAccessRequest } from './createAccessRequest'

export const accessRequestRouter = createTRPCRouter({
  createAccessRequest,
})
