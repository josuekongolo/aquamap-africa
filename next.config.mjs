import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project (a stray lockfile in $HOME otherwise
  // makes Next infer the wrong root for output file tracing).
  turbopack: { root: __dirname },
};

export default nextConfig;
