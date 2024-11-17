import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import { PublicPage } from 'types/publicPage'

const publicPagesDirectory = join(process.cwd(), 'public-pages')

export function getPublicPageSlugs() {
  return fs.readdirSync(publicPagesDirectory)
}

export function getPublicPageBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = join(publicPagesDirectory, `${realSlug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const items = {} as PublicPage

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug
    }
    if (field === 'content') {
      items[field] = content
    }
    if (
      ['footerCategory', 'menuTitle', 'title'].includes(field) &&
      data[field]
    ) {
      items[field as keyof PublicPage] = data[field]
    }
  })

  return items
}

export function getAllPublicPages(fields: string[] = []) {
  const slugs = getPublicPageSlugs()
  const publicPages = slugs.map((slug) => getPublicPageBySlug(slug, fields))
  return publicPages
}
