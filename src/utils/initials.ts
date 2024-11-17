export const initials = (name: string) =>
  name
    ?.split(' ')
    .map((n, i) => (i === 0 || i === name.split(' ').length - 1 ? n[0] : ''))
    .join('')
    .toUpperCase()
