'use client'
import type { Metadata } from 'next'
import { NameType } from '@/data/types'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { cookies } from 'next/dist/client/components/headers'
import { Settings } from '.'

export const metadata: Metadata = {
  title: 'Settings'
}

export default function settings() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const settings = new Settings(cookies())

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
      <div className='text-xl'>Title language: {settings.titleLanguage}</div>
      <select value={settings.titleLanguage} onChange={e => settings.titleLanguage =(Number.parseInt(e.target.value))}>
        <option value={NameType.ORIGINAL}>Native</option>
        <option value={NameType.ENGLISH}>English</option>
        <option value={NameType.ROMAJI}>Romaji</option>
      </select>
    </div>
  )
}