import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RawSettings, SettingsProxy } from "./types";

import { NameType } from "@/data/types";

export class Settings implements SettingsProxy {
    private cookies: ReadonlyRequestCookies
    private cookieName: string
    private settings: RawSettings

    constructor(
        cookies: ReadonlyRequestCookies,
        cookieName: string = 'settings',
        defaultSettings: RawSettings = {
            titleLanguage: NameType.ENGLISH
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
        this.saveSettings()
    }

    private saveSettings() {
        try {
            const stringified = JSON.stringify(this.settings)
            this.cookies.set(this.cookieName, stringified)
        } catch (error) { console.log(error) }
    }

    get titleLanguage() {
        return this.settings.titleLanguage
    }

    set titleLanguage(language: NameType) {
        this.settings.titleLanguage = language
        this.saveSettings()
    }
}