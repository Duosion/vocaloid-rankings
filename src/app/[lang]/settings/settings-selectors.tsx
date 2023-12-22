'use client'
import { SelectFilterElement } from "@/components/filter/select-filter"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { NameType } from "@/data/types"
import { useEffect, useState } from "react"
import { rawSettingsDefault } from "."
import { decodeBoolean, encodeBoolean } from "../rankings/utils"
import { InitialSettings } from "./types"

export function SettingsSelectors(
    {
        initialSettings
    }: {
        initialSettings: InitialSettings
    }
) {
    // import language dictionary
    const langDict = useLocale()

    // get settings
    const { settings, setTitleLanguage, setRankingsViewMode, setTheme, setGoogleAnalytics } = useSettings()

    // wait for mount
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const currentSettings = mounted ? settings : initialSettings

    return (
        <>
            {/* Theme */}
            <SelectFilterElement
                name={langDict['settings_theme']}
                value={currentSettings.theme}
                defaultValue={rawSettingsDefault.theme}
                options={[
                    langDict['settings_theme_system'],
                    langDict['settings_theme_light'],
                    langDict['settings_theme_dark']
                ]}
                onValueChanged={(newValue) => {
                    setTheme(newValue)
                }}
            />

            {/* Title Language */}
            <SelectFilterElement
                name={langDict['settings_title_language']}
                value={Math.max(0, currentSettings.titleLanguage - 1)}
                defaultValue={Math.max(0, rawSettingsDefault.titleLanguage - 1)}
                options={[
                    langDict['settings_title_language_original'],
                    langDict['settings_title_language_english'],
                    langDict['settings_title_language_romaji']
                ]}
                onValueChanged={(newValue) => {
                    switch (newValue) {
                        case 0:
                            setTitleLanguage(NameType.ORIGINAL)
                            break;
                        case 1:
                            setTitleLanguage(NameType.ENGLISH);
                            break;
                        case 2:
                            setTitleLanguage(NameType.ROMAJI);
                            break;
                    }
                }}
            />

            {/* Rankings View Mode */}
            <SelectFilterElement
                name={langDict['settings_rankings_view_mode']}
                value={currentSettings.rankingsViewMode}
                defaultValue={rawSettingsDefault.rankingsViewMode}
                options={[
                    langDict['settings_rankings_view_mode_list'],
                    langDict['settings_rankings_view_mode_grid'],
                ]}
                onValueChanged={(newValue) => {
                    setRankingsViewMode(newValue)
                }}
            />

            {/* Google Analytics */}
            <SelectFilterElement
                name={langDict['settings_google_analytics']}
                value={encodeBoolean(currentSettings.googleAnalytics)}
                defaultValue={encodeBoolean(rawSettingsDefault.googleAnalytics)}
                options={[
                    langDict['settings_google_analytics_disabled'],
                    langDict['settings_google_analytics_enabled']
                ]}
                onValueChanged={(newValue) => {
                    setGoogleAnalytics(decodeBoolean(newValue))
                }}
            />
        </>
    )
}