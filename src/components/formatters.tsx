'use client'

import { useSettings } from "@/app/[lang]/settings/SettingsProvider"
import { NameType, Names } from "@/data/types"
import { getEntityName } from "@/localization"
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
    return compact ? (
        <div title={numberFormatter.format(number)}>{shortenedNumberFormatter.format(number)}</div>
    ) : (
        numberFormatter.format(number)
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

    return (
        getEntityName(names, preferredNameType)
    )
}