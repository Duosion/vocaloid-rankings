/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.youtube.com',
          pathname: '/vi/**'
        },
        {
          protocol: 'https',
          hostname: 'static.vocadb.net'
        },
        {
          protocol: 'https',
          hostname: 'nicovideo.cdn.nimg.jp',
          pathname: '/thumbnails/**'
        }
      ],
    }
  }
  
  module.exports = nextConfig
  