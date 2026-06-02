import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Turbopack which folder is the project root so it
  // doesn't accidentally pick a parent folder with another lockfile.
  turbopack: {
    root: "./",
  },
};

export default nextConfig;
