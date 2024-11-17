import { withSentryConfig } from '@sentry/nextjs'
// @ts-check

import PWA from 'next-pwa'

import { env } from './src/env.mjs'

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import('./src/env.mjs'))

const withPWA = PWA({
  dest: 'public',
  maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/',
    image: '/',
    font: '/',
    video: '/',
    audio: '/',
  },
  disable: process.env.NODE_ENV === 'development',
  dynamicStartUrl: false,
})

const config = withPWA({
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/files/:path*',
        destination: `https://${env.SERVER_AWS_S3_BUCKET_NAME}.s3.${env.SERVER_AWS_REGION}.amazonaws.com/files/:path*`,
      },
    ]
  },
})

export default withSentryConfig(
  config,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: 'ethnote',
    project: 'javascript-nextjs',
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
)

// http://localhost:3000/projects/my-project/.s3.eu-central-1.amazonaws.com/files/clevb3ja00002pob88o68sza3?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA6NUAH4KQA4DDGNNS%2F20230305%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20230305T183721Z&X-Amz-Expires=86400&X-Amz-Signature=69a120dd49a8234b6bf3274eed3734401644edaaca0cef219f695b813cb4aeac&X-Amz-SignedHeaders=host
