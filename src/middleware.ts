// https://github.com/vercel/next.js/blob/canary/examples/app-dir-i18n-routing/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import Negotiator from 'negotiator'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import { locales } from "@/localization";
import { Settings } from "./app/[lang]/settings";
import { cookies } from "next/dist/client/components/headers";
import { NameType } from "./data/types";

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
    const settings = new Settings(cookies())
    const pathname = request.nextUrl.pathname

    let pathNameLocale: string | null = null
    for (const locale of locales) {
        if (pathname.startsWith(`/${locale}`)) {
            pathNameLocale = locale
            break
        }
    }

    const currentLocale = settings.language || getLocale(request)
    if (pathNameLocale !== currentLocale) {
        return NextResponse.redirect(
            new URL(
                `/${currentLocale}${pathname.startsWith('/') ? '' : '/'}${pathNameLocale !== null ? pathname.replace(`${pathNameLocale}/`, '') : pathname}`,
                request.url
            )
        )
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|material_theme|gloabls.css|.*\\..*).*)']
}