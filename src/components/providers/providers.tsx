'use client'
import { SettingsProvider } from '@/components/providers/settings-provider'
import { ThemeProvider } from 'next-themes'
import { graphClient } from '@/lib/api';
import { ClientContext } from 'graphql-hooks'
import { LanguageDictionaryProvider } from './language-dictionary-provider';
import { LanguageDictionary } from '@/localization';

export function Providers(
  {
    dictionary,
    children
  }: {
    dictionary: LanguageDictionary
    children: React.ReactNode
  }
) {
  return (
    <ClientContext.Provider value={graphClient}>
      <ThemeProvider>
        <LanguageDictionaryProvider dictionary={dictionary}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </LanguageDictionaryProvider>
      </ThemeProvider>
    </ClientContext.Provider>
  )
}