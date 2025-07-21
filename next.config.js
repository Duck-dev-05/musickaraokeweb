const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        worker_threads: false,
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        url: require.resolve('url/'),
        assert: require.resolve('assert/'),
        util: require.resolve('util/'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };

      config.plugins = [
        ...config.plugins,
        new (require('webpack')).ProvidePlugin({
          process: ['process/browser'],
          Buffer: ['buffer', 'Buffer'],
        }),
      ];

      // Handle node: protocol imports
      config.resolve.alias = {
        ...config.resolve.alias,
        process: 'process/browser',
      };
    }

    // Enable WebAssembly for both client and server
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // Configure WebAssembly loading
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Ensure WebAssembly files are output correctly
    config.output = {
      ...config.output,
      webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
    };

    return config;
  },
  images: {
    domains: [
      'img.youtube.com',
      'i.ytimg.com',
      'thumbnailer.mixcloud.com',
      'placehold.co',
      'via.placeholder.com', // For placeholder images
      'www.google.com', // For Google favicon
      'lh3.googleusercontent.com', // For Google user profile images
      'images.unsplash.com', // For Unsplash images
      'picsum.photos', // For Lorem Picsum images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thumbnailer.mixcloud.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 