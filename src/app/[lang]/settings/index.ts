import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RawSettings, SettingsProxy } from "./types";
import { NameType } from "@/data/types";
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { RankingsViewMode, SongRankingsFiltersValues } from "../rankings/types";

export class Settings implements SettingsProxy {
    private cookies: RequestCookies | ReadonlyRequestCookies
    private cookieName: string
    private settings: RawSettings

    constructor(
        cookies: RequestCookies | ReadonlyRequestCookies,
        cookieName: string = 'settings',
        defaultSettings: RawSettings = {
            titleLanguage: NameType.ENGLISH,
            rankingsViewMode: RankingsViewMode.LIST
        }
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
}