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
    // Handle 0G SDK and its dependencies
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'circomlibjs': 'commonjs circomlibjs',
        'crypto-js': 'commonjs crypto-js',
      });
    }
    
    // Ensure proper module resolution for ESM packages
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx', '.jsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
    };
    
    // Add extensions for Spline
    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ];
    
    // Add alias for Spline Next.js component
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Add fallback for problematic packages
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Allow importing from Spline package internals
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [/^(.+?[\\/]node_modules[\\/](?!@splinetool))/],
    };
    
    return config;
  },
  serverExternalPackages: ['@0glabs/0g-serving-broker'],
  typescript: {
    // Temporarily ignore type errors during build for 0G SDK
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
