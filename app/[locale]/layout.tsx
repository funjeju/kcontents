import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: {
    default: "K-Drama Life — 한 시대의 한 사람을 살아본다",
    template: "%s | K-Drama Life",
  },
  description:
    "AI가 매번 새로 써주는 한국 시대 인생 시뮬레이션. 당신만의 결말을 찾아가세요.",
  keywords: ["K-drama", "한국 시대극", "인생 시뮬레이션", "AI 게임"],
  openGraph: {
    type: "website",
    siteName: "K-Drama Life",
    title: "K-Drama Life",
    description: "당신의 선택이 결정한다.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  metadataBase: new URL("https://kdramalife.app"),
};

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!routing.locales.includes(locale as "ko" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
