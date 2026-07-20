import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Comfort Studio | Premium Furniture',
  description: 'Discover comfort redefined. Premium furniture for every room.',
  icons: {
    icon: 'https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg',
    shortcut: 'https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg',
    apple: 'https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg" />
        <link rel="shortcut icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg" />
        <link rel="apple-touch-icon" href="https://res.cloudinary.com/iqtgqdjs/image/upload/v1784529648/Logo_nr1yn7.jpg" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
