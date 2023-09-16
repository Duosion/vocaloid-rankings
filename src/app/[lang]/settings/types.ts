import { NameType } from "@/data/types";
import { SongRankingsFiltersValues } from "../rankings/types";

export interface RawSettings {
    titleLanguage: NameType
    rankingsFilter: SongRankingsFiltersValues
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsFilter(): SongRankingsFiltersValues

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsFilter(newParams: SongRankingsFiltersValues)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsFilter: (newParams: SongRankingsFiltersValues) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}