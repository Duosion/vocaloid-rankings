'use client'
import React, { Fragment, createContext, useCallback, useContext, useMemo, useState } from "react";
import { RawSettings, UseSettingsProps, SettingsProviderProps } from "./types";
import { NameType } from "@/data/types";
import { setCookie, getCookie } from 'cookies-next'
import { RankingsViewMode, SongRankingsFiltersValues } from "../rankings/types";
import { cookies } from "next/dist/client/components/headers";

const settingsContext = createContext<UseSettingsProps | undefined>(undefined)
const defaultContext: UseSettingsProps = {
    setTitleLanguage: () => { },
    setRankingsViewMode: () => { },
    settings: {
        titleLanguage: NameType.ENGLISH,
        rankingsViewMode: RankingsViewMode.LIST
    }
}

export const useSettings = () => useContext(settingsContext) ?? defaultContext

export const SettingsProvider: React.FC<SettingsProviderProps> = props => {
    const context = useContext(settingsContext)

    if (context) { return <Fragment>{props.children}</Fragment> }
    return <SettingsElement {...props} />
}

const SettingsElement: React.FC<SettingsProviderProps> = ({
    cookieName = 'settings',
    cookieExpires = new Date('2037/12/31'),
    defaultSettings = defaultContext.settings,
    children
}) => {
    const [settings, setSettingsState] = useState(() => getSettings(cookieName, defaultSettings))

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

    const providerValue = useMemo(() => ({
        settings,
        setTitleLanguage,
        setRankingsViewMode
    }), [settings, setTitleLanguage, setRankingsViewMode])

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