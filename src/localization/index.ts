'server-only'

const dictionaries = {
    en: () => import('./dictionaries/en.json').then(module => module.default),
    ja: () => import('./dictionaries/ja.json').then(module => module.default),
    es: () => import('./dictionaries/es.json').then(module => module.default)
}

export type Locale = keyof typeof dictionaries

export type LanguageDictionary = typeof import('./dictionaries/template.json')

export type LanguageDictionaryKey = keyof LanguageDictionary

export const locales = Object.keys(dictionaries)

export const getDictionary = async (locale: Locale) => {
    const dict =  dictionaries[locale]
    return (dict || dictionaries.en)()
}