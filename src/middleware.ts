// https://github.com/vercel/next.js/blob/canary/examples/app-dir-i18n-routing/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import Negotiator from 'negotiator'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import { locales } from "@/localization";
import { Settings } from "./app/[lang]/settings";
import { cookies } from "next/dist/client/components/headers";

const deafultLocale = 'en'

const getLocale = (request: NextRequest): string => {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => (headers[key] = value))

    const languages = new Negotiator({headers: headers}).languages(
        locales
    )

    return matchLocale(languages, locales, deafultLocale)
}

export function middleware(
    request: NextRequest
) {
    const pathname = request.nextUrl.pathname

    const pathNameIsMissingLocale = locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    if (pathNameIsMissingLocale) {
        const settings = new Settings(cookies())

        return NextResponse.redirect(
            new URL(
                `/${settings.language || getLocale(request)}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
                request.url
            )
        )
    }
    
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|material_theme|gloabls.css|.*\\..*).*)']
}