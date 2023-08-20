'server-only'

import { NameType, Names } from '@/data/types'

const dictionaries = {
    en: () => import('./dictionaries/en.json').then(module => module.default),
    ja: () => import('./dictionaries/ja.json').then(module => module.default),
    es: () => import('./dictionaries/es.json').then(module => module.default)
}

// name map for getEntityName
const NameMap: { [key in NameType]: NameType[] } = {
    [NameType.ORIGINAL]: [NameType.ORIGINAL],
    [NameType.JAPANESE]: [NameType.JAPANESE],
    [NameType.ENGLISH]: [NameType.ENGLISH, NameType.ROMAJI],
    [NameType.ROMAJI]: [NameType.ROMAJI, NameType.ENGLISH]
}

export type Locale = keyof typeof dictionaries

export type LanguageDictionary = typeof import('./dictionaries/template.json')

export type LanguageDictionaryKey = keyof LanguageDictionary

export const locales = Object.keys(dictionaries)

export const getDictionary = async (locale: Locale) => {
    const dict =  dictionaries[locale]
    return (dict || dictionaries.en)()
}

export function getEntityName(
    names: Names,
    preferred: NameType
): string {
    const map = NameMap[preferred]
    let name = names[NameType.ORIGINAL]
    if (map) {
        for (let i = 0; i < map.length; i++) {
            const exists = names[map[i]]
            if (exists) {
                name = exists
                break
            }
        }
    }
    return name
}