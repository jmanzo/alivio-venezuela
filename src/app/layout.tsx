import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Centros de Acopio — Guía de donaciones en tiempo real",
  description:
    "Consulta qué necesita cada centro de acopio antes de donar. Semáforo en vivo de artículos críticos, necesarios y suficientes tras el terremoto en Venezuela.",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
        <Footer />
      </body>
    </html>
  );
}
