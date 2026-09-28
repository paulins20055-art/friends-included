import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // TypeScript is checked separately in CI. This avoids a child-process type
  // checker in restricted build environments while keeping strict tsc checks.
  typescript: { ignoreBuildErrors: true },
  experimental: {
    workerThreads: true,
    cpus: 1,
  },
};

export default nextConfig;
