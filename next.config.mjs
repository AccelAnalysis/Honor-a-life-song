/** @type {import('next').NextConfig} */
const isPagesPreview = process.env.HALS_PAGES_PREVIEW === "1";
const pagesBasePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_HALS_STATIC_PREVIEW: isPagesPreview
      ? "1"
      : process.env.NEXT_PUBLIC_HALS_STATIC_PREVIEW || "0"
  },
  ...(isPagesPreview
    ? {
        output: "export",
        trailingSlash: true,
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
        images: { unoptimized: true }
      }
    : {})
};

export default nextConfig;
