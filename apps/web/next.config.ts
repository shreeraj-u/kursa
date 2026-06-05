import "@kursa/env/web";
import type { NextConfig } from "next";

const apiOrigin = process.env.SERVER_INTERNAL_URL ?? "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${apiOrigin}/api/auth/:path*` },
      { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
