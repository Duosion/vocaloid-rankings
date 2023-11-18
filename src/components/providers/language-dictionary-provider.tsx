'use client'
import { LanguageDictionary } from "@/localization";
import { createContext, useContext } from "react";

const localeContext = createContext<LanguageDictionary>({} as LanguageDictionary)

export const useLocale = () => useContext(localeContext)

export function LanguageDictionaryProvider(
    {
        dictionary,
        children
    }: {
        dictionary: LanguageDictionary
        children: React.ReactNode
    }
) {
    return (
        <localeContext.Provider
            value={dictionary}
        >
            {children}
        </localeContext.Provider>
    )
}