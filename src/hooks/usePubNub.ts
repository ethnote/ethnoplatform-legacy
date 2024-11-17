import { env } from 'env.mjs'
import PubNub from 'pubnub'

const pubnub = new PubNub({
  publishKey: env.NEXT_PUBLIC_PUBNUB_PUBLISH_KEY,
  subscribeKey: env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY,
  userId: env.NEXT_PUBLIC_PUBNUB_USER_ID,
})

export const usePubNub = () => {
  const listen = (channel: string, callback: (message: any) => void) => {
    pubnub.addListener({
      message: (message) => {
        callback(message)
      },
    })
    pubnub.subscribe({
      channels: [channel],
    })

    return () => {
      pubnub.unsubscribe({
        channels: [channel],
      })
    }
  }

  return { listen }
}
