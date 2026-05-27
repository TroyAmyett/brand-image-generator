import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headless-render deps ship native/binary assets and must not be bundled
  // into the serverless function output — keep them external.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
