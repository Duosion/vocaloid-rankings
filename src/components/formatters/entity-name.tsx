'use client'
import { useSettings } from "@/app/[lang]/settings/SettingsProvider"
import { NameType, Names } from "@/data/types"
import { getEntityName } from "@/localization"
import { useEffect, useState } from "react"

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