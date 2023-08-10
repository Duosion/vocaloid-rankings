'use client'
import type { Metadata } from 'next'
import { NameType } from '@/data/types'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { LanguageDictionary, Locale, getDictionary } from '@/localization'
import { useSettings } from './SettingsProvider'
import { NameTypeLocaleTokens } from '@/localization/DictionaryTokenMaps'

export const metadata: Metadata = {
  title: 'Settings'
}

export default function settings(
  {
    params
  }: {
    params: {
      lang: Locale
    }
  }
) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { settings, setTitleLanguage } = useSettings()
  const [langDict, setLangDict] = useState({} as LanguageDictionary)

  useEffect(() => {
    setMounted(true)
    getDictionary(params.lang).then(dict => setLangDict(dict))
  }, [])

  if (!mounted || !langDict) {
    return null
  }

  return (
    <div className=' gap-3 flex flex-col'>
      <div className='text-xl'>Theme: {theme}</div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      <div className='text-xl'>Title language: {langDict[NameTypeLocaleTokens[settings.titleLanguage]]}</div>
      <select value={settings.titleLanguage} onChange={ e => setTitleLanguage((Number.parseInt(e.target.value))) }>
        <option value={NameType.ORIGINAL}>Native</option>
        <option value={NameType.ENGLISH}>English</option>
        <option value={NameType.ROMAJI}>Romaji</option>
      </select>
    </div>
  )
}