import { NameType } from "@/data/types";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export interface RawSettings {
    titleLanguage: NameType
}

export interface SettingsProxy {
    get titleLanguage (): NameType

    set titleLanguage (NameType)
}

export interface CookieProxy {

    get(name: string): string | undefined

    set(name: string, value: string, options?: ResponseCookie): void

    delete(name: string): void

}