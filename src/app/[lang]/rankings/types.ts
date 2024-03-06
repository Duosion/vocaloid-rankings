import { ArtistType, FilterDirection, FilterInclusionMode, FilterOrder, Names, SongType, SourceType } from "@/data/types"
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

export enum RankingsViewMode {
    LIST,
    GRID
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
    defaultValue?: string[]

    constructor(
        name: LanguageDictionaryKey,
        key: string,
        displayActive: boolean = true,
        values: SelectFilterValue<Enum>[],
        defaultValue?: string[]
    ) {
        super(name, key, displayActive, FilterType.MULTI)
        this.values = values
        this.defaultValue = defaultValue
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

// song rankings filters
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
    direction: SelectFilter<FilterDirection>
    startAt: InputFilter
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
    direction?: number
    startAt?: string
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
    direction?: number
    startAt?: string
}

// artists rankings filters
export interface ArtistRankingsFilters {
    search: InputFilter
    timePeriod: SelectFilter<number>
    songPublishYear: InputFilter
    songPublishMonth: InputFilter
    songPublishDay: InputFilter
    releaseYear: InputFilter
    releaseMonth: InputFilter
    releaseDay: InputFilter
    includeSourceTypes: MultiFilter<SourceType>
    includeSongTypes: MultiFilter<SongType>
    includeArtistTypes: MultiFilter<ArtistType>
    excludeSourceTypes: MultiFilter<SourceType>
    excludeSongTypes: MultiFilter<SongType>
    excludeArtistTypes: MultiFilter<ArtistType>
    minViews: InputFilter
    maxViews: InputFilter
    orderBy: SelectFilter<FilterOrder>
    to: TimestampFilter
    from: TimestampFilter
    timestamp: TimestampFilter
    singleVideo: CheckboxFilter
    includeArtists: MultiEntityFilter
    excludeArtists: MultiEntityFilter
    includeCoArtistsOf: MultiEntityFilter
    combineSimilarArtists: CheckboxFilter
    direction: SelectFilter<FilterDirection>
    startAt: InputFilter
}

export interface ArtistRankingsFiltersValues {
    search?: string
    timePeriod?: number
    songPublishYear?: string
    songPublishMonth?: string
    songPublishDay?: string
    releaseYear?: string
    releaseMonth?: string
    releaseDay?: string
    includeSourceTypes?: string
    includeSongTypes?: string
    includeArtistTypes?: string
    excludeSourceTypes?: string
    excludeSongTypes?: string
    excludeArtistTypes?: string
    minViews?: string
    maxViews?: string
    orderBy?: number
    from?: string
    timestamp?: string
    singleVideo?: number
    includeArtists?: string
    excludeArtists?: string
    includeCoArtistsOf?: string
    combineSimilarArtists?: number
    direction?: number
    startAt?: string
}

export interface ArtistRankingsFilterBarValues {
    search?: string
    timePeriod?: number
    songPublishYear?: string
    songPublishMonth?: string
    songPublishDay?: string
    releaseYear?: string
    releaseMonth?: string
    releaseDay?: string
    includeSourceTypes?: number[]
    includeSongTypes?: number[]
    includeArtistTypes?: number[]
    excludeSourceTypes?: number[]
    excludeSongTypes?: number[]
    excludeArtistTypes?: number[]
    minViews?: string
    maxViews?: string
    orderBy?: number
    from?: Date
    timestamp?: Date
    singleVideo?: boolean
    includeArtists?: number[]
    excludeArtists?: number[]
    includeCoArtistsOf?: number[]
    combineSimilarArtists?: boolean
    direction?: number
    startAt?: string
}

export interface TrendingFilters {
    timePeriod: SelectFilter<number>
    from: TimestampFilter
    timestamp: TimestampFilter
    direction: SelectFilter<FilterDirection>
    startAt: InputFilter
    includeSourceTypes: MultiFilter<SourceType>
    excludeSourceTypes: MultiFilter<SourceType>
}

export interface TrendingFiltersValues {
    timePeriod?: number
    from?: string
    timestamp?: string
    direction?: number
    startAt?: string
    includeSourceTypes?: string
    excludeSourceTypes?: string
}

export interface TrendingFilterBarValues {
    timePeriod?: number
    from?: Date
    timestamp?: Date
    direction?: number
    startAt?: string
    includeSourceTypes?: number[]
    excludeSourceTypes?: number[]
}

// describes a list of entity names with their ids mapped to a Names types
export type EntityNames = { [key: number]: string }