import { SongType, SourceType } from "@/data/types"
import { LanguageDictionaryKey } from "@/localization"

export enum FilterType {
    SELECT,
    INPUT,
    CHECKBOX,
}

export abstract class Filter {
    name: LanguageDictionaryKey
    key: string
    type: FilterType

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        type: FilterType
    ) {
        this.name = name
        this.key = key
        this.type = type
    }
}

export interface SelectFilterValue<Enum> {
    name: LanguageDictionaryKey
    value: Enum | null | undefined
}

export class SelectFilter<Enum> extends Filter {
    values: SelectFilterValue<Enum>[]
    defaultValue: number

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        values: SelectFilterValue<Enum>[],
        defaultValue: number
    ) {
        super(name, key, FilterType.SELECT)
        this.values = values
        this.defaultValue = defaultValue
    }
}

export class InputFilter extends Filter {
    defaultValue: string
    placeholder: LanguageDictionaryKey

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        placeholder: LanguageDictionaryKey,
        defaultValue: string = ''
    ) {
        super(name, key, FilterType.SELECT)
        this.defaultValue = defaultValue
        this.placeholder = placeholder
    }
}

export interface RankingsFilters {
    sourceType: SelectFilter<SourceType>
    timePeriod: SelectFilter<number>
    year: InputFilter
    songType: SelectFilter<SongType>
}

export interface RankingsFiltersValues {
    sourceType?: number
    timePeriod?: number
    year?: string
    songType?: number
}