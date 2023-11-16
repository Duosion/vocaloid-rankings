'use client'
import { SettingsProvider } from '@/components/providers/settings-provider'
import { ThemeProvider } from 'next-themes'
import { graphClient } from '@/lib/api';
import { ClientContext } from 'graphql-hooks'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientContext.Provider value={graphClient}>
      <ThemeProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </ClientContext.Provider>
  )
}