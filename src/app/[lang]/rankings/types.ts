import { ArtistType, FilterOrder, SongType, SourceType } from "@/data/types"
import { LanguageDictionaryKey } from "@/localization"

export enum FilterType {
    SELECT,
    INPUT,
    CHECKBOX,
}

export enum PopupAlignment {
    RIGHT,
    CENTER,
    LEFT
}

export abstract class Filter {
    name: LanguageDictionaryKey
    key: string
    displayActive: boolean
    type: FilterType

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        type: FilterType
    ) {
        this.name = name
        this.key = key
        this.displayActive = displayActive
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
        displayActive: boolean = true,
        values: SelectFilterValue<Enum>[],
        defaultValue: number
    ) {
        super(name, key, displayActive, FilterType.SELECT)
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
        displayActive: boolean = true,
        placeholder: LanguageDictionaryKey,
        defaultValue: string = ''
    ) {
        super(name, key, displayActive, FilterType.SELECT)
        this.defaultValue = defaultValue
        this.placeholder = placeholder
    }
}

export class CheckboxFilter extends Filter {
    defaultValue: boolean

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        defaultValue: boolean = false
    ) {
        super(name, key, displayActive, FilterType.SELECT)
        this.defaultValue = defaultValue
    }
}

export interface RankingsFilters {
    search: InputFilter
    sourceType: SelectFilter<SourceType>
    timePeriod: SelectFilter<number>
    year: InputFilter
    songType: SelectFilter<SongType>
    artistType: SelectFilter<ArtistType>
    minViews: InputFilter
    maxViews: InputFilter
    orderBy: SelectFilter<FilterOrder>
    timestamp: InputFilter
    singleVideo: CheckboxFilter
}

export interface RankingsFiltersValues {
    search?: string
    sourceType?: number
    timePeriod?: number
    year?: string
    songType?: number
    artistType?: number
    minViews?: string
    maxViews?: string
    orderBy?: number
    timestamp?: string
    singleVideo?: number
}