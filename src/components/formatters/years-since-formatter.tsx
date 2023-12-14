'use client'

import { useLocale } from "../providers/language-dictionary-provider"

export function YearsSinceFormatter(
    {
        date
    }: {
        date: Date
    }
) {
    const now = new Date()
    const langDict = useLocale()
    
    const yearsDiff = Math.ceil(now.getFullYear() - date.getFullYear())

    return (
        <>
            {yearsDiff > 1 ? langDict.home_years_since_release.replace(':years', yearsDiff.toString()) : langDict.home_year_since_release}
        </>
    )
}