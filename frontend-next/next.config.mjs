/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/geolocation",
        destination: "/Geolocation",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
      {
        source: "/login/:path*",
        destination: "/auth/login/:path*",
        permanent: true,
      },
      {
        source: "/login_auth",
        destination: "/auth/login_auth",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/auth/signup",
        permanent: true,
      },
      {
        source: "/signup/:path*",
        destination: "/auth/signup/:path*",
        permanent: true,
      },
      {
        source: "/distributer",
        destination: "/distributor/dashboard",
        permanent: true,
      },
      {
        source: "/distributer/:path*",
        destination: "/distributor/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
