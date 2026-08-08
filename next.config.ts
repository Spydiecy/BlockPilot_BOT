import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'prod.spline.design' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'circomlibjs': 'commonjs circomlibjs',
        'crypto-js': 'commonjs crypto-js',
      });
    }

    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx', '.jsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    };

    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ];

    config.resolve.alias = {
      ...config.resolve.alias,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    config.snapshot = {
      ...config.snapshot,
      managedPaths: [/^(.+?[\\/]node_modules[\\/](?!@splinetool))/],
    };

    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
