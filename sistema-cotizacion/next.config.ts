import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir imágenes de Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Excluir @react-pdf/renderer del bundle SSR (sólo cliente)
  serverExternalPackages: ['@react-pdf/renderer'],
  // Configurar Turbopack (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
