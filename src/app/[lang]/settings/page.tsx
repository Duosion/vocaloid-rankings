'use client'
import type { Metadata } from 'next'
import { NameType } from '@/data/types'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { CookiesClient, Settings } from '.'
import { Locale } from '@/localization'

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
  const settings = new Settings(new CookiesClient())
  const [titleLanguage, setTitleLanguage] = useState(settings.titleLanguage)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
      <div className='text-xl'>Title language: {titleLanguage}</div>
      <select value={titleLanguage} onChange={e => { 
          const newTitleLanguage = (Number.parseInt(e.target.value))
          settings.titleLanguage = newTitleLanguage
          setTitleLanguage(newTitleLanguage)
        }}>
        <option value={NameType.ORIGINAL}>Native</option>
        <option value={NameType.ENGLISH}>English</option>
        <option value={NameType.ROMAJI}>Romaji</option>
      </select>
    </div>
  )
}