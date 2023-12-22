'use client'
import Script from "next/script";
import { useSettings } from "../providers/settings-provider";
import { useEffect, useState } from "react";

export function GoogleAnalytics(
    {
        tag
    }: {
        tag: string
    }
) {
    const { settings } = useSettings()

    return settings.googleAnalytics ? (
        <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${tag}`} />
            <Script id='google-analytics'>
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
    
                    gtag('config', '${tag}');
                `}
            </Script>
        </>
    ) : undefined
}