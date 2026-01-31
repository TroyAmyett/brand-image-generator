import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@funnelists/auth', '@funnelists/ui'],
};

export default nextConfig;
