import { NameType } from "@/data/types";
import { RankingsViewMode } from "../rankings/types";

export enum Theme {
    SYSTEM,
    LIGHT,
    DARK
}

export interface RawSettings {
    titleLanguage: NameType
    rankingsViewMode: RankingsViewMode
    theme: Theme
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsViewMode(): RankingsViewMode

    get theme(): Theme

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsViewMode(newRankingsViewMode: RankingsViewMode)

}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsViewMode: (newViewMode: RankingsViewMode) => void
    setTheme: (newTheme: Theme) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}