const { exec } = require('child_process')
const fs = require('fs')
const dotenv = require('dotenv')
const { getHelpText } = require('./generatorHelp')

dotenv.config()

const pathRegex = /^\/?(\[?[A-z0-9-]+]?\/?)+$/
const fileNameRegex = /(\[?[A-z0-9-]+]?)+\.tsx$/

const camelize = (s) => s.replace(/-./g, (x) => x[1].toUpperCase())
const pascalize = (s) => s[0].toUpperCase() + camelize(s.slice(1))

const input = process.argv[3]?.trim()

// Check arguments
if (input.toLocaleLowerCase() !== input) {
  throw Error(
    'Name included a capital letter. Name must be kebab-case (e.g. new-page)' +
      `\n\n${getHelpText()}`,
  )
}

// initial cleanup of path arg
let path = input
  ?.trim()
  // remove index or index.tsx since we'll add back later
  .replace(/index(.tsx)?/, '')
  // remove preceding and trailing slashes
  .replace(/\/$/, '')
  .replace(/^\//, '')

// with auth?
const type = process.argv[2]?.trim()

if (type) {
  if (!['crud', 'auth', 'normal'].includes(type)) {
    throw Error(
      'Type must be one of: ' +
        '[auth, crud]' +
        `. Was ${type}.` +
        `\n\n${getHelpText()}`,
    )
  }
}

withAuth = type === 'auth'
isCrud = type === 'crud'

path = 'src/pages/' + path

let dir
let fileName
let name

if (fileNameRegex.test(path)) {
  // if a file name (not index.tsx) is specified
  // eg. foo/bar/baz.tsx
  // we split   ^ here so we get
  //
  //  "foo/bar"   and   "baz.tsx"
  //
  const splitPoint = path.lastIndexOf('/')
  dir = path.slice(0, splitPoint)
  fileName = path.slice(splitPoint + 1)
  name = pascalize(fileName.replace('.tsx', '').replace(/\[]/, ''))
} else {
  // no file name specified
  // eg. foo/bar
  dir = path
  fileName = 'index.tsx'
  name = pascalize(path.slice(path.lastIndexOf('/') + 1).replace(/\[]/, ''))
}

if (!pathRegex.test(dir)) {
  throw Error('path must be a valid format.' + `\n\n${getHelpText()}`)
}

while (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const componentPath = `${dir}/${fileName}`
const crudPath = `${dir}/[id].tsx`
const componentSnippet = `import { Layout } from 'layouts'
import { NextPage } from 'next'
import { FC } from 'react'

const ${name}: FC<NextPage> = () => {
  return (
    <Layout pageTitle='PAGE TITLE HERE'>
      <p>content here</p>
    </Layout>
  )
}

export default ${name}
`

const componentSnippetAuth = `import { AuthenticatedLayout } from 'layouts'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { FC } from 'react'

const ${name}: FC<NextPage> = () => {
  const { data: session } = useSession()

  return (
    <AuthenticatedLayout session={session} pageTitle='PAGE TITLE HERE'>
      <p>Logged in with user id: {session?.user?.id}</p>
    </AuthenticatedLayout>
  )
}

export default ${name}
`

const crudSnippet = `/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { gql } from '@apollo/client'
import {
  Button,
  ButtonGroup,
  Center,
  Container,
  Spinner,
  Box,
} from '@chakra-ui/react'
import { createColumnHelper } from '@tanstack/react-table'
import { EasyTable } from 'components'
import { useQueryWithAuth } from 'hooks/useQueryWithContext'
import AuthenticatedLayout from 'layouts/authenticated-layout/AuthenticatedLayout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC } from 'react'
import {
  ${name}Query,
  ${name}Query_${name.toLocaleLowerCase()}s,
} from '__generated__/${name}Query'

const ${name.toUpperCase()} = gql\`
  query ${name}Query($id: ID!) {
    ${name.toLocaleLowerCase()}s(id: $id) {
      id
    }
  }
\`

const ${name}: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { id } = useRouter().query
  const router = useRouter()

  const { data, loading } = useQueryWithAuth<${name}Query>(${name.toUpperCase()}, {
    variables: {
      id,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
    skip: !id,
  })

  const columnHelper = createColumnHelper<${name}Query_${name.toLocaleLowerCase()}s>()

  const columns = [
    columnHelper.accessor('createdAt', {
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      header: 'Created at',
    }),
    columnHelper.accessor('id', {
      cell: (info) => (
        <ButtonGroup>
          <Button size='sm' onClick={() => router.push(\`/${name}/\${info.getValue()}\`)}>
            Edit
          </Button>
        </ButtonGroup>
      ),
      header: undefined,
    }),
  ]

  const new${name} = () => {
    router.push('')
  }

  return (
    <AuthenticatedLayout session={session} pageTitle='${name}'>
      <Container py={10} maxW={'1300px'}>
        <Button mb={4} colorScheme='blue' onClick={new${name}}>
          Create new ${name}
        </Button>
        <Box>
          {loading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <EasyTable
              columns={columns}
              data={data || []}
            />
          )}
        </Box>
      </Container>
    </AuthenticatedLayout>
  )
}

export default ${name}
`

fs.writeFile(
  componentPath,
  withAuth ? componentSnippetAuth : isCrud ? crudSnippet : componentSnippet,
  (err) => {
    if (err) {
      console.error(err)
      return
    }
    console.log('Created page', name)
  },
)

const createOrEditSnippet = `import { gql } from '@apollo/client'
import { Button, Center, Container, Heading, Spinner, Box } from '@chakra-ui/react'
import { EasyForm } from 'components'
import useHandleResponse from 'hooks/useHandleResponse'
import {
  useMutationWithAuth,
  useQueryWithAuth,
} from 'hooks/useQueryWithContext'
import AuthenticatedLayout from 'layouts/authenticated-layout/AuthenticatedLayout'
import { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC } from 'react'
import { Create${name} } from '__generated__/Create${name}'
import { Delete${name} } from '__generated__/Delete${name}'
import {
  ${name}ProjectsQuery,
  ${name}ProjectsQuery_${name.toLocaleLowerCase()},
} from '__generated__/${name}ProjectsQuery'
import { Update${name} } from '__generated__/Update${name}'

const ${name.toUpperCase()} = gql\`
  query ${name}ProjectsQuery($id: ID!) {
    ${name.toLocaleLowerCase()}(id: $id) {
      id
    }
  }
\`

const CREATE_${name.toUpperCase()} = gql\`
  mutation Create${name}($input: Create${name}Input!) {
    create${name}(input: $input) {
      ${name.toLocaleLowerCase()} {
        id
      }
    }
  }
\`

const UPDATE_${name.toUpperCase()} = gql\`
  mutation Update${name}($input: Update${name}Input!) {
    update${name}(input: $input) {
      ${name.toLocaleLowerCase()} {
        id
      }
    }
  }
\`

const DELETE_${name.toUpperCase()} = gql\`
  mutation Delete${name}($input: Delete${name}Input!) {
    delete${name}(input: $input) {
      didDelete
    }
  }
\`

const ${name}: FC<NextPage> = () => {
  const { id } = useRouter().query
  const { push } = useRouter()
  const { data: session } = useSession()
  const handleResponse = useHandleResponse()
  const isNew = id === 'new'

  const { data, refetch, loading } = useQueryWithAuth<${name}ProjectsQuery>(
    ${name.toUpperCase()},
    {
      variables: {
        id,
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-first',
      skip: isNew,
    },
  )

  const [create${name}] = useMutationWithAuth<Create${name}>(CREATE_${name.toUpperCase()})
  const [update${name}] = useMutationWithAuth<Update${name}>(UPDATE_${name.toUpperCase()})
  const [delete${name}] = useMutationWithAuth<Delete${name}>(DELETE_${name.toUpperCase()})

  const onCreate = async (values: Partial<${name}ProjectsQuery_${name.toLocaleLowerCase()}>) => {
    const res = await create${name}({
      variables: {
        input: {
          ...values,
          id,
          paid: false,
          confirmed: false,
        },
      },
    })
    handleResponse(
      \`Successfully created ${name.toLocaleLowerCase()}: \${values.title}\`,
      'An error occurred while creating the ${name.toLocaleLowerCase()}',
      res,
    )
    refetch()
  }

  const onUpdate = async (values: Partial<${name}ProjectsQuery_${name.toLocaleLowerCase()}>) => {
    const res = await update${name}({
      variables: {
        input: {
          id,
          ...values,
        },
      },
    })
    handleResponse(
      \`Successfully update ${name.toLocaleLowerCase()}: \${values.title}\`,
      'An error occurred while updating the ${name.toLocaleLowerCase()}',
      res,
    )
    refetch()
  }

  const onDelete${name}Clicked = async () => {
    if (!confirm('Are you sure you want to delete this ${name.toLocaleLowerCase()}?')) return
    const res = await delete${name}({
      variables: {
        input: {
          id,
        },
      },
      update(cache) {
        const normalizedId = cache.identify({ id, __typename: '${name}' })
        cache.evict({ id: normalizedId })
        cache.gc()
      },
    })
    handleResponse(
      \`Successfully deleted ${name.toLocaleLowerCase()}: \${data?.${name.toLocaleLowerCase()}.title}\`,
      'An error occurred while deleting the ${name.toLocaleLowerCase()}',
      res,
    )
    refetch()
    setTimeout(() => push(\`/${name}/\${id}/${name.toLocaleLowerCase()}s\`), 0)
  }

  return (
    <AuthenticatedLayout session={session} pageTitle='${name}'>
      <Container py={10} maxW={'800px'}>
        <Button
          mb={4}
          variant='outline'
          onClick={() => {
            push(\`/${name}/\${id}/${name.toLocaleLowerCase()}s\`)
          }}
        >
          Go back
        </Button>
        <Box>
          <Heading size='lg'>{isNew ? 'New ${name.toLocaleLowerCase()}' : 'Edit ${name.toLocaleLowerCase()}'}</Heading>
          {loading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <EasyForm<${name}ProjectsQuery_${name.toLocaleLowerCase()}>
              initialValues={{
                title: data?.title || '',
              }}
              loading={false}
              config={{
                title: {
                  kind: 'input',
                  label: 'Title',
                  optional: true,
                },
              }}
              onSubmit={isNew ? onCreate : onUpdate}
              submitButtonText={isNew ? 'Create ${name.toLocaleLowerCase()}' : 'Update ${name.toLocaleLowerCase()}'}
              cancelButtonText='Delete ${name.toLocaleLowerCase()}'
              onCancel={!isNew ? onDelete${name}Clicked : undefined}
            />
          )}
        </Box>
      </Container>
    </AuthenticatedLayout>
  )
}

export default ${name}
`

if (isCrud) {
  fs.writeFile(crudPath, createOrEditSnippet, (err) => {
    if (err) {
      console.error(err)
      return
    }
    console.log('Created crud page', name)
  })
}

// so people who like other IDEs, like webstorm, can use those instead
const ideCmd = process.env.IDE_CMD ?? 'code'

exec(`${ideCmd} ${componentPath}`, (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`)
    return
  }
  console.log(`stdout: ${stdout}`)
})
