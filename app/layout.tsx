import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sabin Factory Invitation Generator',
  description: 'Personalize and copy a Sabin factory visit invitation for Outlook.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
