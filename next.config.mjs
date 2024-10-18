import withMDX from '@next/mdx';

const nextConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    // Дополнительные опции, если нужны
  },
})({
  // Ваши другие настройки Next.js
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
});

export default nextConfig;
  