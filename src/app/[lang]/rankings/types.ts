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
    name: LanguageDictionaryKey | string
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

export interface RankingsFilters {
    sourceType: SelectFilter<SourceType>
    timePeriod: SelectFilter<number>
    year: SelectFilter<number>
    songType: SelectFilter<SongType>
}

export interface RankingsFiltersValues {
    sourceType?: number
    timePeriod?: number
    year?: number
    songType?: number
}