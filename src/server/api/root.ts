import { createTRPCRouter } from 'server/api/trpc'

import { accessRequestRouter } from './routers/accessRequest/router'
import { commentRouter } from './routers/comment/router'
import { meRouter } from './routers/me/router'
import { noteRouter } from './routers/note/router'
import { projectRouter } from './routers/project/router'
import { superAdminRouter } from './routers/superAdmin/router'

export const appRouter = createTRPCRouter({
  me: meRouter,
  project: projectRouter,
  note: noteRouter,
  comment: commentRouter,
  superAdmin: superAdminRouter,
  accessRequest: accessRequestRouter,
})

export type AppRouter = typeof appRouter
