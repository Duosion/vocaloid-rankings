import { NameType } from "@/data/types";
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RankingsViewMode } from "../rankings/types";
import { RawSettings, SettingsProxy, Theme } from "./types";
import { Locale } from "@/localization";

export const rawSettingsDefault: RawSettings = {
    titleLanguage: NameType.ENGLISH,
    rankingsViewMode: RankingsViewMode.GRID,
    theme: Theme.SYSTEM,
    googleAnalytics: true,
    language: null
}

export class Settings implements SettingsProxy {
    private cookies: RequestCookies | ReadonlyRequestCookies
    private cookieName: string
    private settings: RawSettings

    constructor(
        cookies: RequestCookies | ReadonlyRequestCookies,
        cookieName: string = 'settings',
        defaultSettings: RawSettings = rawSettingsDefault
    ) {
        this.cookies = cookies
        this.cookieName = cookieName
        
        // import settings
        const rawCookie = cookies.get(cookieName)
        let parsedCookie: RawSettings = defaultSettings

        if (rawCookie) {
            try {
                parsedCookie = {
                    ...defaultSettings,
                    ...JSON.parse(rawCookie.value)
                }
            } catch (error) {}
        }

        this.settings = parsedCookie
    }

    private saveSettings() {
        try {
            const stringified = JSON.stringify(this.settings)
            this.cookies.set(this.cookieName, stringified)
        } catch (error) { console.log(error) }
    }

    // title language
    get titleLanguage() {
        return this.settings.titleLanguage
    }

    set titleLanguage(language: NameType) {
        this.settings.titleLanguage = language
        this.saveSettings()
    }

    // rankings filter
    get rankingsViewMode() {
        return this.settings.rankingsViewMode
    }

    set rankingsViewMode(newMode: RankingsViewMode) {
        this.settings.rankingsViewMode = newMode
        this.saveSettings()
    }

    // theme
    get theme() {
        return this.settings.theme
    }

    // google analytics
    get googleAnalytics() {
        return this.settings.googleAnalytics
    }

    set googleAnalytics(enabled: boolean) {
        this.settings.googleAnalytics = enabled
        this.saveSettings()
    }

    // locale
    get language(): Locale | null {
        return this.settings.language
    }

    set language(newLanguage: Locale) {
        this.settings.language = newLanguage
        this.saveSettings()
    }

}