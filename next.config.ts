import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  agentRules: false,
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
