import { NameType } from "@/data/types";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export interface RawSettings {
    titleLanguage: NameType
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    set titleLanguage(newTitleLanguage: NameType)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}