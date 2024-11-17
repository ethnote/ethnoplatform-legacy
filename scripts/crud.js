const fs = require('fs')

const name = process.argv[2]?.trim()

if (name[0].toUpperCase() !== name[0]) {
  throw Error('Component name must start with a capital letter')
}

const lowerCased = name[0].toLowerCase() + name.slice(1)

const dbModel = `
model ${name} {
    id        String   @id @default(cuid())
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    name      String
}
`

const getOne = `import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const ${lowerCased} = publicProcedure
.input(
  z.object({
    id: z.string().optional(),
  }),
)
.query(async ({ input, ctx }) => {
  const { prisma } = ctx
  const { id } = input

  const ${lowerCased} = await prisma.${lowerCased}.findFirst({
    where: {
      id,
    },
  })

  return ${lowerCased}
})
`

const getAll = `import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const ${lowerCased}s = publicProcedure
.input(
  z.object({
    id: z.string().optional(),
  }),
)
.query(async ({ input, ctx }) => {
  const { prisma } = ctx
  const { id } = input

  const ${lowerCased} = await prisma.${lowerCased}.findMany({
    where: {
      id,
    },
  })

  return ${lowerCased}
})
`

const create = `import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const create${name} = protectedProcedure
.input(
  z.object({
    name: z.string(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { prisma } = ctx
  const { name } = input

  const ${lowerCased} = await prisma.${lowerCased}.create({
    data: {
      name,
    },
  })

  return ${lowerCased}
})
`

const update = `import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const update${name} = protectedProcedure
.input(
  z.object({
    id: z.string()
    name: z.string().optional(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { prisma } = ctx
  const { id, name } = input

  const ${lowerCased} = await prisma.${lowerCased}.update({
    where: {
      id,
    },
    data: {
      name,
    },
  })

  return ${lowerCased}
})
`

const del = `import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const delete${name} = protectedProcedure
.input(
  z.object({
    id: z.string().optional(),
  }),
)
.mutation(async ({ input, ctx }) => {
  const { prisma } = ctx
  const { id } = input

  const ${lowerCased} = await prisma.${lowerCased}.delete({
    where: {
      id,
    },
  })

  return ${lowerCased}
})
`

const router = `import { createTRPCRouter } from '../../trpc'
import { create${name} } from './create${name}'
import { delete${name} } from './delete${name}'
import { ${lowerCased} } from './${lowerCased}'
import { ${lowerCased}s } from './${lowerCased}s'
import { update${name} } from './update${name}'

export const ${lowerCased}Router = createTRPCRouter({
  ${lowerCased},
  ${lowerCased}s,
  create${name},
  update${name},
  delete${name},
})
`

// Make API dir
fs.mkdir(`./src/server/api/routers/${lowerCased}`, (err) => {
  if (err) throw err
  console.log('Created', name)
})

// Write files
fs.appendFile(`./prisma/schema.prisma`, dbModel, (err) => {
  if (err) throw err
  console.log('Created', name)
})

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/${lowerCased}.ts`,
  getOne,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/${lowerCased}s.ts`,
  getAll,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/create${name}.ts`,
  create,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/update${name}.ts`,
  update,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/delete${name}.ts`,
  del,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

fs.writeFile(
  `./src/server/api/routers/${lowerCased}/router.ts`,
  router,
  (err) => {
    if (err) throw err
    console.log('Created', name)
  },
)

console.log('Add:')
console.log(`${lowerCased}: ${lowerCased}Router,`)
console.log('to root.ts')
