/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.id-mpl.com" },
      { protocol: "https", hostname: "cdn2.vistek.id" },
      { protocol: "https", hostname: "wsrv.nl" },
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
};

export default nextConfig;
