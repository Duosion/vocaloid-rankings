'use client'
import { SettingsProvider } from '@/app/[lang]/settings/settings-provider'
import { ThemeProvider } from 'next-themes'
import { ApolloProvider } from '@apollo/client';
import { graphClient } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={graphClient}>
      <ThemeProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </ApolloProvider>
  )
}