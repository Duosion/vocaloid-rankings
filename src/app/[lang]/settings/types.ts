import { NameType } from "@/data/types";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { RankingsFilterSearchParams } from "../rankings/types";

export interface RawSettings {
    titleLanguage: NameType
    rankingsFilter: RankingsFilterSearchParams
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsFilter(): RankingsFilterSearchParams

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsFilter(newParams: RankingsFilterSearchParams)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsFilter: (newParams: RankingsFilterSearchParams) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}