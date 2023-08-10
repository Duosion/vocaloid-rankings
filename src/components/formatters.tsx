'use client'

import { useSettings } from "@/app/[lang]/settings/SettingsProvider"
import { NameType, Names } from "@/data/types"
import { useEffect, useState } from "react"

const numberFormatter = new Intl.NumberFormat()
const shortenedNumberFormatter = new Intl.NumberFormat(undefined, {
    notation: 'compact'
})
const dateFormatter = new Intl.DateTimeFormat()
const shortenedDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
})

// name map for EntityName component
const NameMap: { [key in NameType]: NameType[] } = {
    [NameType.ORIGINAL]: [NameType.ORIGINAL],
    [NameType.JAPANESE]: [NameType.JAPANESE],
    [NameType.ENGLISH]: [NameType.ENGLISH, NameType.ROMAJI],
    [NameType.ROMAJI]: [NameType.ROMAJI, NameType.ENGLISH]
}

export function NumberFormatter(
    {
        number,
        compact = false
    }: {
        number: number
        compact?: boolean
    }
) {
    const formatter = compact ? shortenedNumberFormatter : numberFormatter
    return (
        formatter.format(number)
    )
}

export function DateFormatter(
    {
        date,
        compact = false
    }: {
        date: number | Date
        compact?: boolean
    }
) {
    const formatter = compact ? shortenedDateFormatter : dateFormatter
    return (
        formatter.format(date)
    )
}

export function EntityName(
    {
        names,
        preferred
    }: {
        names: Names,
        preferred: NameType
    }
) {
    const [preferredNameType, setPreferredNameType] = useState(preferred)
    const { settings } = useSettings()

    useEffect(() => {
        setPreferredNameType(settings.titleLanguage)
    }, [])

    const map = NameMap[preferredNameType]
    let name = names[NameType.ORIGINAL]
    if (map) {
        for (let i = 0; i < map.length; i++) {
            const exists = names[map[i]]
            if (exists) {
                name = exists
                break
            }
        }
    }
    return (
        name
    )
}