import { NameType } from "@/data/types";

export interface RawSettings {
    titleLanguage: NameType
}

export interface SettingsProxy {
    get titleLanguage (): NameType

    set titleLanguage (NameType)
}
