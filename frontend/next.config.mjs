/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-native": false,
      };
    }
    return config;
  },
  async rewrites() {
    const gatewayUrl = process.env.API_GATEWAY_URL || "http://localhost:8080";
    return [
      // Inngest dev server probes common framework paths — proxy to worker
      {
        source: "/.netlify/functions/inngest",
        destination: `${gatewayUrl}/api/inngest`,
      },
      {
        source: "/.redwood/functions/inngest",
        destination: `${gatewayUrl}/api/inngest`,
      },
      {
        source: "/api/inngest",
        destination: `${gatewayUrl}/api/inngest`,
      },
      {
        source: "/api/inngest/:path*",
        destination: `${gatewayUrl}/api/inngest/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${gatewayUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
