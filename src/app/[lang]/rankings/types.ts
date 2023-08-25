import { SongType, SourceType } from "@/data/types"
import { LanguageDictionaryKey } from "@/localization"

export enum FilterType {
    SELECT,
    INPUT,
    CHECKBOX,
}

export abstract class Filter {
    name: LanguageDictionaryKey
    type: FilterType

    constructor(
        name: LanguageDictionaryKey,
        type: FilterType
    ) {
        this.name = name
        this.type = type
    }
}

export interface SelectFilterValue<Enum> {
    name: LanguageDictionaryKey
    value: Enum | null
}

export class SelectFilter<Enum> extends Filter {
    values: SelectFilterValue<Enum>[]
    defaultValue: number
    
    constructor(
        name: LanguageDictionaryKey,
        values: SelectFilterValue<Enum>[],
        defaultValue: number
    ) {
        super(name, FilterType.SELECT)
        this.values = values
        this.defaultValue = defaultValue
    }
}

export interface FilterBarSelectFilter {
    key: string
    name: string
    type: FilterType
    values: string[]
    value: number
    defaultValue: number
}

export type FilterBarFilters = (FilterBarSelectFilter)[]

export interface RankingsFilters {
    sourceType: SelectFilter<SourceType>
    songType: SelectFilter<SongType>
}

export interface RankingsFilterValues {
    songType: SongType 
    sourceType: SourceType
}

export interface RankingsFilterSearchParams {
    songType?: number
    sourceType?: number
}