// https://github.com/vercel/next.js/blob/canary/examples/app-dir-i18n-routing/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import Negotiator from 'negotiator'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import { locales } from "@/localization";

const deafultLocale = 'en'

const getLocale = (request: NextRequest): string => {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => (headers[key] = value))

    let languages = new Negotiator({headers: headers}).languages(
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
        return NextResponse.redirect(
            new URL(
                `/${getLocale(request)}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
                request.url
            )
        )
    }
    
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|material_theme|gloabls.css|.*\\..*).*)']
}