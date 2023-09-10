import { NameType } from "@/data/types";
import { RankingsFiltersValues } from "../rankings/types";

export interface RawSettings {
    titleLanguage: NameType
    rankingsFilter: RankingsFiltersValues
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsFilter(): RankingsFiltersValues

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsFilter(newParams: RankingsFiltersValues)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsFilter: (newParams: RankingsFiltersValues) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}