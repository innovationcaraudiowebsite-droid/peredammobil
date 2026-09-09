import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'peredammobiljakarta.com' },
      { protocol: 'http', hostname: 'peredammobiljakarta.com' },
      { protocol: 'https', hostname: 'www.peredammobiljakarta.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      // Supabase Storage — featured/inline/site-asset images live here
      { protocol: 'https', hostname: 'dxtxpobdnskdfqmlskyv.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      // Z-AI in-house image-search results are re-hosted on this CDN
      { protocol: 'https', hostname: 'z-cdn.chatglm.cn' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
