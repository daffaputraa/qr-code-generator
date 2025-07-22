import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VA QR Code Generator",
  description: "VA QR Code Generator mantabh 👍",
  openGraph: {
    title: "VA QR Code Generator",
    description: "Deskripsi OG",
    siteName: "VA QR Code Generator mantabh 👍",
    images: [
      {
        url: "https://opengraph.b-cdn.net/production/images/01eb7d20-267a-4e86-82f0-ec05ed603f60.png?token=ZF-oP1ihdgqpkZh-YSzr97vwhGSEfnaUyzfPrYgHaYs&height=630&width=1200&expires=33289159842",
        width: 1200,
        height: 630,
        alt: "Deskripsi gambar",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "VA QR Code Generator",
    title: "VA QR Code Generator",
    description: "VA QR Code Generator mantabh 👍",
    images: [
      "https://opengraph.b-cdn.net/production/images/01eb7d20-267a-4e86-82f0-ec05ed603f60.png?token=ZF-oP1ihdgqpkZh-YSzr97vwhGSEfnaUyzfPrYgHaYs&height=630&width=1200&expires=33289159842",
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-100 px-5 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
