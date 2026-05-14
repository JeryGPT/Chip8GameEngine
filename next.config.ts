import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '*',
    '127.0.0.1',
    'localhost',
    '192.168.0.122'
  ],
  reactCompiler: true,
};
module.exports = nextConfig