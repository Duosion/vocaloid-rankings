import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { CookieProxy, RawSettings, SettingsProxy } from "./types";
import { NameType } from "@/data/types";
import { RequestCookies, ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { OptionsType } from "cookies-next/lib/types";

export class CookiesServer implements CookieProxy {
    private cookies: RequestCookies | ReadonlyRequestCookies

    constructor(
        cookies: RequestCookies | ReadonlyRequestCookies
    ) {
        this.cookies = cookies
    }

    get(name: string) {
        const cookie = this.cookies.get(name)
        return cookie ? cookie.value : undefined
    }

    set(
        name: string, 
        value: string,
        options?: ResponseCookie
    ) {
        this.cookies.set(
            name,
            value,
            options
        )
    }

    delete(name: string) {
        this.cookies.delete(name)
    }
}

export class CookiesClient implements CookieProxy {
    get(name: string) {
        return getCookie(name)?.toString()
    }

    set(
        name: string, 
        value: string,
        options?: ResponseCookie
    ) {
        setCookie(name, value, options as OptionsType)
    }

    delete(name: string) {
        deleteCookie(name)
    }
}

export class Settings implements SettingsProxy {
    private cookies: CookieProxy
    private cookieName: string
    private settings: RawSettings

    constructor(
        cookies: CookieProxy,
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
                    ...JSON.parse(rawCookie)
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

    get titleLanguage() {
        return this.settings.titleLanguage
    }

    set titleLanguage(language: NameType) {
        this.settings.titleLanguage = language
        this.saveSettings()
    }
}