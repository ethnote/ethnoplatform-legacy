type Props = {
  projectName?: string
  projectHandle?: string
  noteName?: string
  noteHandle?: string
}

export const projectBreadcrumbs = (p: Props) => {
  return {
    inProject: [
      {
        label: 'Projects',
        href: '/projects',
      },
      {
        label: p.projectName as string,
        href: `/projects/${p.projectHandle}/notes`,
      },
    ],
    inNote: [
      {
        label: 'Projects',
        href: '/projects',
      },
      {
        label: p.projectName as string,
        href: `/projects/${p.projectHandle}/notes`,
      },
      {
        label: p.noteName as string,
        href: `/projects/${p.projectHandle}/notes/${p.noteHandle}`,
      },
    ],
  }
}
