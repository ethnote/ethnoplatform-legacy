import { env } from 'env.mjs'
import PubNub from 'pubnub'

const pubnub = new PubNub({
  publishKey: env.NEXT_PUBLIC_PUBNUB_PUBLISH_KEY,
  subscribeKey: env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY,
  userId: env.NEXT_PUBLIC_PUBNUB_USER_ID,
})

export const publishMessage = async (channel: string, message: any) => {
  await pubnub.publish({
    channel,
    message,
  })
}
