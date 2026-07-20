import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Comfort Studio | Premium Furniture',
  description: 'Discover comfort redefined. Premium furniture for every room.',
  icons: {
    icon: 'https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png',
    shortcut: 'https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png',
    apple: 'https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png" />
        <link rel="shortcut icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png" />
        <link rel="apple-touch-icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/e_make_transparent/v1784529648/Logo_nr1yn7.png" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
