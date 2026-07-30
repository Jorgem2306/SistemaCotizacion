import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exportación estática para Electron
  output: 'export',
  // Permitir imágenes de Supabase Storage y quitar optimización por defecto
  images: {
    unoptimized: true,
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
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
