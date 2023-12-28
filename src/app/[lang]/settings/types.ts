import { NameType } from "@/data/types";
import { RankingsViewMode } from "../rankings/types";
import { Locale } from "@/localization";

export enum Theme {
    SYSTEM,
    LIGHT,
    DARK
}

export interface InitialSettings {
    titleLanguage: number
    rankingsViewMode: number
    theme: number
    googleAnalytics: boolean
    language: string | null
}

export interface RawSettings {
    titleLanguage: NameType
    rankingsViewMode: RankingsViewMode
    theme: Theme,
    googleAnalytics: boolean,
    language: Locale | null
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsViewMode(): RankingsViewMode

    get googleAnalytics(): boolean

    get theme(): Theme

    get language(): Locale | null

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsViewMode(newRankingsViewMode: RankingsViewMode)

    set googleAnalytics(enabled: boolean)

    set language(newLanguage: Locale | null)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsViewMode: (newViewMode: RankingsViewMode) => void
    setTheme: (newTheme: Theme) => void
    setGoogleAnalytics: (enabled: boolean) => void
    setLanguage: (newLanguage: Locale | null) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}