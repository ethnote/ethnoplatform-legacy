import { MentionElement } from 'components/comments/CommentWriteArea'

export const getHashtags = (nodes: any): string[] => {
  let hashtagTypes: string[] = []

  for (const node of nodes) {
    if (node.type === 'hashtag' && node.hashtag) {
      hashtagTypes.push(node.hashtag)
    }

    if (node.children) {
      hashtagTypes = hashtagTypes.concat(getHashtags(node.children))
    }
  }

  return hashtagTypes
}

export const getCommentMentions = (nodes: any): MentionElement[] => {
  let commentMentions: MentionElement[] = []

  for (const node of nodes) {
    if (node.type === 'comment-mention' && node.mentionId) {
      commentMentions.push(node as MentionElement)
    }

    if (node.children) {
      commentMentions = commentMentions.concat(
        getCommentMentions(node.children),
      )
    }
  }

  return commentMentions
}

export const getMentions = (nodes: any): string[] => {
  let mentionTypes: string[] = []

  for (const node of nodes) {
    if (node.type === 'mention' && node.hashtag) {
      mentionTypes.push(node.hashtag)
    }

    if (node.children) {
      mentionTypes = mentionTypes.concat(getMentions(node.children))
    }
  }

  return mentionTypes
}
