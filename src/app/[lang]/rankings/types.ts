import { ArtistType, FilterInclusionMode, FilterOrder, Names, SongType, SourceType } from "@/data/types"
import { LanguageDictionaryKey } from "@/localization"

export enum FilterType {
    SELECT,
    INPUT,
    CHECKBOX,
    MULTI,
    MULTI_ENTITY,
    TIMESTAMP
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
    value: Enum | null
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

export class MultiFilter<Enum> extends Filter {
    values: SelectFilterValue<Enum>[]

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        values: SelectFilterValue<Enum>[]
    ) {
        super(name, key, displayActive, FilterType.MULTI)
        this.values = values
    }
}

export class MultiEntityFilter extends Filter {
    placeholder: LanguageDictionaryKey

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        placeholder: LanguageDictionaryKey
    ) {
        super(name, key, displayActive, FilterType.MULTI_ENTITY)
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

export class TimestampFilter extends Filter {
    placeholder: LanguageDictionaryKey

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        placeholder: LanguageDictionaryKey,
    ) {
        super(name, key, displayActive, FilterType.TIMESTAMP)
        this.placeholder = placeholder
    }
}

export interface RankingsFilters {
    search: InputFilter
    timePeriod: SelectFilter<number>
    publishYear: InputFilter
    publishMonth: InputFilter
    publishDay: InputFilter
    includeSourceTypes: MultiFilter<SourceType>
    includeSongTypes: MultiFilter<SongType>
    includeArtistTypes: MultiFilter<ArtistType>
    excludeSourceTypes: MultiFilter<SourceType>
    excludeSongTypes: MultiFilter<SongType>
    excludeArtistTypes: MultiFilter<ArtistType>
    includeArtistTypesMode: SelectFilter<FilterInclusionMode>
    excludeArtistTypesMode: SelectFilter<FilterInclusionMode>
    minViews: InputFilter
    maxViews: InputFilter
    orderBy: SelectFilter<FilterOrder>
    to: TimestampFilter
    from: TimestampFilter
    timestamp: TimestampFilter
    singleVideo: CheckboxFilter
    includeArtists: MultiEntityFilter
    excludeArtists: MultiEntityFilter
    includeArtistsMode: SelectFilter<FilterInclusionMode>
    excludeArtistsMode: SelectFilter<FilterInclusionMode>
    includeSimilarArtists: CheckboxFilter
}

export interface SongRankingsFiltersValues {
    search?: string
    timePeriod?: number
    publishYear?: string
    publishMonth?: string
    publishDay?: string
    includeSourceTypes?: string
    includeSongTypes?: string
    includeArtistTypes?: string
    excludeSourceTypes?: string
    excludeSongTypes?: string
    excludeArtistTypes?: string
    includeArtistTypesMode?: number
    excludeArtistTypesMode?: number
    minViews?: string
    maxViews?: string
    orderBy?: number
    from?: string
    timestamp?: string
    singleVideo?: number
    includeArtists?: string
    excludeArtists?: string
    includeArtistsMode?: number
    excludeArtistsMode?: number
    includeSimilarArtists?: number
}

export interface SongRankingsFilterBarValues {
    search?: string
    timePeriod?: number
    publishYear?: string
    publishMonth?: string
    publishDay?: string
    includeSourceTypes?: number[]
    includeSongTypes?: number[]
    includeArtistTypes?: number[]
    excludeSourceTypes?: number[]
    excludeSongTypes?: number[]
    excludeArtistTypes?: number[]
    includeArtistTypesMode?: number
    excludeArtistTypesMode?: number
    minViews?: string
    maxViews?: string
    orderBy?: number
    from?: Date
    timestamp?: Date
    singleVideo?: boolean
    includeArtists?: number[]
    excludeArtists?: number[]
    includeArtistsMode?: number
    excludeArtistsMode?: number
    includeSimilarArtists?: boolean
}

// describes a list of entity names with their ids mapped to a Names types
export type EntityNames = { [key: number]: string }