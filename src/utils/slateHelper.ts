import { Descendant, Node } from 'slate'

export const serializeSlateJson = (nodes: any) => {
  return nodes?.map((n: Descendant) => Node.string(n)).join('\n')
}
