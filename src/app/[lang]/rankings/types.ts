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

export interface ClientFilterValue {
    name: string
    value: number | null
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

export interface Filters {
    songType: SelectFilter<SongType>
    sourceType: SelectFilter<SourceType>
}