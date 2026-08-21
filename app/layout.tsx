import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cuatrohuellas.cl"),
  title: {
    default: "Cuatro Huellas — Peluquería Canina en Valdivia",
    template: "%s · Cuatro Huellas",
  },
  description:
    "Peluquería canina en Valdivia. Baño, corte, servicio completo y deslanado para tu perro. Reserva tu hora online, sin abono. Rubén Darío 146, Valdivia.",
  keywords: [
    "peluquería canina Valdivia",
    "peluquería de perros Valdivia",
    "baño canino Valdivia",
    "corte de pelo perros Valdivia",
    "grooming Valdivia",
    "Cuatro Huellas Valdivia",
    "deslanado perros Valdivia",
  ],
  authors: [{ name: "Cuatro Huellas" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cuatro Huellas — Peluquería Canina en Valdivia",
    description:
      "Baño, corte y mucho amor para tu perro. Reserva tu hora online en minutos, sin abono. Valdivia.",
    url: "https://cuatrohuellas.cl",
    siteName: "Cuatro Huellas",
    locale: "es_CL",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
