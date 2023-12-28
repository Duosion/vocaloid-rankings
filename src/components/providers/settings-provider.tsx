'use client'
import { NameType } from "@/data/types";
import { getCookie, setCookie } from 'cookies-next';
import React, { Fragment, createContext, useCallback, useContext, useMemo, useState } from "react";
import { RankingsViewMode } from "../../app/[lang]/rankings/types";
import { RawSettings, SettingsProviderProps, Theme, UseSettingsProps } from "../../app/[lang]/settings/types";
import { rawSettingsDefault } from "@/app/[lang]/settings";
import { useTheme } from "next-themes";
import { Locale } from "@/localization";

const settingsContext = createContext<UseSettingsProps | undefined>(undefined)
const defaultSettingsContext: UseSettingsProps = {
    setTitleLanguage: () => { },
    setRankingsViewMode: () => { },
    setTheme: () => {},
    setGoogleAnalytics: () => {},
    setLanguage: () => {},
    settings: rawSettingsDefault
}

const mapThemeToString: { [key in Theme]: string} = {
    [Theme.SYSTEM]: 'system',
    [Theme.LIGHT]: 'light',
    [Theme.DARK]: 'dark'
}

export const useSettings = () => useContext(settingsContext) ?? defaultSettingsContext

export const SettingsProvider: React.FC<SettingsProviderProps> = props => {
    const context = useContext(settingsContext)

    if (context) { return <Fragment>{props.children}</Fragment> }
    return <SettingsElement {...props} />
}

const SettingsElement: React.FC<SettingsProviderProps> = ({
    cookieName = 'settings',
    cookieExpires = new Date('2037/12/31'),
    defaultSettings = rawSettingsDefault,
    children
}) => {
    const [settings, setSettingsState] = useState(() => getSettings(cookieName, defaultSettings))
    const { setTheme } = useTheme()

    const saveSettings = useCallback(
        (settings: RawSettings) => {
            setSettingsState(settings)
            // try to save to local storage
            try {
                setCookie(cookieName, JSON.stringify(settings), {
                    expires: cookieExpires
                })
            } catch (_) { }
        },
        [cookieExpires, cookieName]
    )

    const setTitleLanguage = useCallback(
        (titleLanguage: NameType) => {
            saveSettings({
                ...settings,
                titleLanguage: titleLanguage,
            })
        },
        [saveSettings, settings]
    )

    const setRankingsViewMode = useCallback(
        (newViewMode: RankingsViewMode) => {
            saveSettings({
                ...settings,
                rankingsViewMode: newViewMode
            })
        },
        [saveSettings, settings]
    )

    const setThemeSetting = useCallback(
        (newTheme: Theme) => {
            setTheme(mapThemeToString[newTheme])
            saveSettings({
                ...settings,
                theme: newTheme
            })
        },
        [saveSettings, settings, setTheme]
    )

    const setGoogleAnalytics = useCallback(
        (enabled: boolean) => {
            saveSettings({
                ...settings,
                googleAnalytics: enabled
            })
        },
        [saveSettings, settings]
    )

    const setLanguage = useCallback(
        (newLanguage: Locale | null) => {
            saveSettings({
                ...settings,
                language: newLanguage
            })
        },
        [saveSettings, settings]
    )

    const providerValue = useMemo(() => ({
        settings,
        setTitleLanguage,
        setRankingsViewMode,
        setTheme: setThemeSetting,
        setGoogleAnalytics: setGoogleAnalytics,
        setLanguage: setLanguage
    }), [settings, setTitleLanguage, setRankingsViewMode, setThemeSetting, setGoogleAnalytics, setLanguage])

    return (
        <settingsContext.Provider
            value={providerValue}
        >
            {children}
        </settingsContext.Provider>
    )

}

const getSettings = (key: string, fallback: RawSettings): RawSettings => {
    let settings
    try {
        const item = getCookie(key)?.toString()
        settings = item ? JSON.parse(item) as RawSettings : null
    } catch (_) { }
    return settings || fallback
}