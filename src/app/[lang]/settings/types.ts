import { NameType } from "@/data/types";
import { RankingsViewMode, SongRankingsFiltersValues } from "../rankings/types";

export interface RawSettings {
    titleLanguage: NameType
    rankingsViewMode: RankingsViewMode
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsViewMode(): RankingsViewMode

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsViewMode(newRankingsViewMode: RankingsViewMode)

}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsViewMode: (newViewMode: RankingsViewMode) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}