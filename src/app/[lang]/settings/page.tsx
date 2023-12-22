'use client'
import { Locale, getDictionary } from "@/localization"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { useSettings } from "@/components/providers/settings-provider"
import { rawSettingsDefault } from "."
import { SelectFilterElement } from "@/components/filter/select-filter"
import { useEffect, useState } from "react"
import { NameType } from "@/data/types"
import { decodeBoolean, encodeBoolean } from "../rankings/utils"

export default function AddSongPage() {

    const [mounted, setMounted] = useState(false)

    // import language dictionary
    const langDict = useLocale()

    // get settings
    const { settings, setTitleLanguage, setRankingsViewMode, setTheme, setGoogleAnalytics } = useSettings()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen max-w-4xl">
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.settings}</h1>

            {/* Theme */}
            <SelectFilterElement
                name={langDict['settings_theme']}
                value={settings.theme}
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
                value={Math.max(0, settings.titleLanguage - 1)}
                defaultValue={Math.max(0, rawSettingsDefault.titleLanguage - 1)}
                options={[
                    langDict['settings_title_language_original'],
                    langDict['settings_title_language_english'],
                    langDict['settings_title_language_romaji']
                ]}
                onValueChanged={(newValue) => {
                    switch(newValue) {
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
                value={settings.rankingsViewMode}
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
                value={encodeBoolean(settings.googleAnalytics)}
                defaultValue={encodeBoolean(settings.googleAnalytics)}
                options={[
                    langDict['settings_google_analytics_disabled'],
                    langDict['settings_google_analytics_enabled']
                ]}
                onValueChanged={(newValue) => {
                    setGoogleAnalytics(decodeBoolean(newValue))
                }}
            />

        </section>
    )

}