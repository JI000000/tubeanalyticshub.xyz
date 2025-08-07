import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, validateLocale } from '@/i18n/config';

export const metadata: Metadata = {
  title: "YouTube Analytics Platform",
  description: "AI-powered YouTube Analytics Platform for professional content analysis and insights",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = validateLocale(rawLocale);
  
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}