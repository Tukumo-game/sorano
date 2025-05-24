// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import TabsLayout from './tabs-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '空想通貨アプリ SORANO',
  description: '仮想通貨の実験アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <TabsLayout>{children}</TabsLayout>
        </div>
      </body>
    </html>
  );
}