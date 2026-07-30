import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DIMATEX PERU — Sistema de Cotizaciones",
  description: "Sistema de cotizaciones para DIMATEX PERU — gestión de clientes, productos y generación de PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('dimatex_theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
