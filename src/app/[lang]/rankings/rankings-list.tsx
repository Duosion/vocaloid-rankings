'use client'
import { LanguageDictionary, getEntityName } from "@/localization"
import { EntityNames, FilterType, InputFilter, RankingsFilters, RankingsViewMode, SelectFilterValue, SongRankingsFilterBarValues, SongRankingsFiltersValues } from "./types"
import { useEffect, useState } from "react"
import { SongRankingsActiveFilterBar } from "./song-rankings-active-filter-bar"
import { DummyRankingsListItem } from "@/components/rankings/dummy-rankings-list-item"
import { buildEntityNames, graphClient } from "@/lib/api"
import { RankingListItem } from "@/components/rankings/rankings-list-item"
import { EntityName } from "@/components/formatters/entity-name"
import { useSettings } from "../settings/settings-provider"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { ApiArtist, ApiSongRankingsFilterResult } from "@/lib/api/types"
import { useTheme } from "next-themes"
import Link from "next/link"
import { ArtistType, FilterInclusionMode, FilterOrder, SongType, SourceType } from "@/data/types"
import { TransitionGroup } from "react-transition-group"
import { useQuery, gql, ApolloQueryResult } from "@apollo/client"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { Divider } from "@/components/material/divider"
import { SongArtistsLabel } from "@/components/formatters/song-artists-label"

function encodeBoolean(
    bool: boolean
): number {
    return bool ? 1 : 0
}

function decodeBoolean(
    num?: number
): boolean {
    return num == 1
}

function encodeMultiFilter(
    values: number[],
    separator: string = ','
): string {
    const builder = []
    for (const value of values) {
        if (!isNaN(value)) builder.push(value)
    }
    return builder.join(separator)
}

function decodeMultiFilter(
    input?: string,
    separator: string = ','
): number[] {
    const output: number[] = []

    input?.split(separator).map(rawValue => {
        const parsed = Number(rawValue)
        if (!isNaN(parsed)) {
            output.push(parsed)
        }
    })

    return output
}

function parseParamSelectFilterValue(
    paramValue: number | undefined,
    values: SelectFilterValue<number>[],
    defaultValue?: number
): number | null {
    // get the filterValue and return it
    const valueNumber = (paramValue == undefined || isNaN(paramValue)) ? (defaultValue == undefined || isNaN(defaultValue)) ? null : defaultValue : paramValue
    return valueNumber != null ? (values[valueNumber]).value : null
}

const GET_ARTISTS_NAMES = gql`
query GetArtistsNames(
    $ids: [Int]!
) {
    artists(
        ids: $ids
    ) {
        id
        names {
            original
            japanese
            english
            romaji
        }
    }
}
`

const GET_SONG_RANKINGS = gql`
query SongRankings(
    $timestamp: String
    $timePeriodOffset: Int
    $changeOffset: Int
    $daysOffset: Int
    $includeSourceTypes: [SourceType]
    $excludeSourceTypes: [SourceType]
    $includeSongTypes: [SongType]
    $excludeSongTypes: [SongType]
    $includeArtistTypes: [ArtistType]
    $excludeArtistTypes: [ArtistType]
    $includeArtistTypesMode: FilterInclusionMode
    $excludeArtistTypesMode: FilterInclusionMode
    $publishDate: String
    $orderBy: FilterOrder
    $direction: FilterDirection
    $includeArtists: [Int]
    $includeArtistsMode: FilterInclusionMode
    $excludeArtists: [Int]
    $excludeArtistsMode: FilterInclusionMode
    $includeSimilarArtists: Boolean
    $songs: [Int]
    $singleVideo: Boolean
    $maxEntries: Int
    $startAt: Int
    $minViews: Long
    $maxViews: Long
    $search: String
) {
    songRankings(
        timestamp: $timestamp
        timePeriodOffset: $timePeriodOffset
        changeOffset: $changeOffset
        daysOffset: $daysOffset
        includeSourceTypes: $includeSourceTypes
        excludeSourceTypes: $excludeSourceTypes
        includeSongTypes: $includeSongTypes
        excludeSongTypes: $excludeSongTypes
        includeArtistTypes: $includeArtistTypes
        excludeArtistTypes: $excludeArtistTypes
        includeArtistTypesMode: $includeArtistTypesMode
        excludeArtistTypesMode: $excludeArtistTypesMode
        publishDate: $publishDate
        orderBy: $orderBy
        direction: $direction
        includeArtists: $includeArtists
        includeArtistsMode: $includeArtistsMode
        excludeArtists: $excludeArtists
        excludeArtistsMode: $excludeArtistsMode
        includeSimilarArtists: $includeSimilarArtists
        songs: $songs
        singleVideo: $singleVideo
        maxEntries: $maxEntries
        startAt: $startAt
        minViews: $minViews
        maxViews: $maxViews
        search: $search
    ) {
        totalCount
        timestamp
        results {
            placement
            change
            previousPlacement
            views
            song {
                id
                thumbnail
                darkColor
                lightColor
                artists {
                    id
                    category
                    names {
                        original
                        japanese
                        romaji
                        english
                    }
                    darkColor
                    lightColor
                }
                names {
                    original
                    japanese
                    romaji
                    english
                }
            }
        }
    }
}
`

export function RankingsList(
    {
        href,
        filters,
        langDict,
        filterValues,
        currentTimestamp,
        viewMode
    }: {
        href: string
        filters: RankingsFilters
        langDict: LanguageDictionary
        filterValues: SongRankingsFiltersValues
        currentTimestamp: string
        viewMode: RankingsViewMode
    }
) {
    // import contexts
    const { settings, setRankingsViewMode } = useSettings()
    const { resolvedTheme } = useTheme()

    // import settings
    const settingTitleLanguage = settings.titleLanguage
    const [rankingsViewMode, setViewMode] = useState(viewMode)

    // convert current timestamp to date
    const currentTimestampDate = new Date(currentTimestamp)

    // convert filterValues into filterBarValues
    let [filterBarValues, setFilterValues] = useState({
        search: filterValues.search,
        timePeriod: filterValues.timePeriod,
        publishYear: filterValues.publishYear,
        publishMonth: filterValues.publishMonth,
        publishDay: filterValues.publishDay,
        includeSourceTypes: decodeMultiFilter(filterValues.includeSourceTypes),
        excludeSourceTypes: decodeMultiFilter(filterValues.excludeSourceTypes),
        includeSongTypes: decodeMultiFilter(filterValues.includeSongTypes),
        excludeSongTypes: decodeMultiFilter(filterValues.excludeSongTypes),
        includeArtistTypes: decodeMultiFilter(filterValues.includeArtistTypes),
        excludeArtistTypes: decodeMultiFilter(filterValues.excludeArtistTypes),
        includeArtistTypesMode: filterValues.includeArtistTypesMode,
        excludeArtistTypesMode: filterValues.excludeArtistTypesMode,
        minViews: filterValues.minViews,
        maxViews: filterValues.maxViews,
        orderBy: filterValues.orderBy,
        from: filterValues.from ? new Date(filterValues.from) : undefined,
        timestamp: filterValues.timestamp ? new Date(filterValues.timestamp) : undefined,
        singleVideo: decodeBoolean(Number(filterValues.singleVideo)),
        includeArtists: decodeMultiFilter(filterValues.includeArtists),
        excludeArtists: decodeMultiFilter(filterValues.excludeArtists),
        includeArtistsMode: filterValues.includeArtistsMode,
        excludeArtistsMode: filterValues.excludeArtistsMode,
        includeSimilarArtists: decodeBoolean(Number(filterValues.includeSimilarArtists))
    } as SongRankingsFilterBarValues)

    // entity names state
    const [entityNames, setEntityNames] = useState({} as EntityNames)

    // returns a table of query variables for querying GraphQL with.
    const getQueryVariables = () => {
        // build & set query variables
        const includeSourceTypes = filterBarValues.includeSourceTypes?.map(type => SourceType[type])
        const excludeSourceTypes = filterBarValues.excludeSourceTypes?.map(type => SourceType[type])
        const includeSongTypes = filterBarValues.includeSongTypes?.map(type => SongType[type])
        const excludeSongTypes = filterBarValues.excludeSongTypes?.map(type => SongType[type])
        const includeArtistTypes = filterBarValues.includeArtistTypes?.map(type => ArtistType[type])
        const excludeArtistTypes = filterBarValues.excludeArtistTypes?.map(type => ArtistType[type])

        // build publish date
        const yearParam = filterBarValues.publishYear
        const monthParam = filterBarValues.publishMonth
        const dayParam = filterBarValues.publishDay

        let publishDate: string | undefined = undefined
        if (yearParam || monthParam || dayParam) {
            const year = !yearParam || isNaN(Number(yearParam)) ? '%' : yearParam
            const month = !monthParam || isNaN(Number(monthParam)) ? '%' : monthParam.padStart(2, '0')
            const day = !dayParam || isNaN(Number(dayParam)) ? '%' : dayParam.padStart(2, '0')
            publishDate = `${year}-${month}-${day}%`
        }

        // get custom time period offset
        const to = filterBarValues.timestamp || currentTimestampDate
        const from = filterBarValues.from

        let customTimePeriodOffset: number | undefined
        if (filterBarValues.timePeriod == 4 && from && to) {
            // get the difference in milliseconds between the two dates
            const difference = Math.abs(to.getTime() - from.getTime())
            // convert the difference, which is in milliseconds into days and set the timePeriodOffset to that value
            customTimePeriodOffset = Math.floor(difference / (24 * 60 * 60 * 1000))
        }

        return {
            timestamp: filterBarValues.timestamp ? filterBarValues.timestamp?.toISOString() : undefined,
            timePeriodOffset: customTimePeriodOffset !== undefined ? customTimePeriodOffset : parseParamSelectFilterValue(filterBarValues.timePeriod, filters.timePeriod.values, filters.timePeriod.defaultValue),
            includeSourceTypes: includeSourceTypes && includeSourceTypes.length > 0 ? includeSourceTypes : undefined,
            excludeSourceTypes: excludeSourceTypes && excludeSourceTypes.length > 0 ? excludeSourceTypes : undefined,
            includeSongTypes: includeSongTypes && includeSongTypes.length > 0 ? includeSongTypes : undefined,
            excludeSongTypes: excludeSongTypes && excludeSongTypes.length > 0 ? excludeSongTypes : undefined,
            includeArtistTypes: includeArtistTypes && includeArtistTypes.length > 0 ? includeArtistTypes : undefined,
            excludeArtistTypes: excludeArtistTypes && excludeArtistTypes.length > 0 ? excludeArtistTypes : undefined,
            includeArtistTypesMode: filterBarValues.includeArtistTypesMode == undefined ? undefined : FilterInclusionMode[filterBarValues.includeArtistTypesMode],
            excludeArtistTypesMode: filterBarValues.excludeArtistTypesMode == undefined ? undefined : FilterInclusionMode[filterBarValues.excludeArtistTypesMode],
            publishDate: publishDate,
            orderBy: filterBarValues.orderBy == undefined ? undefined : FilterOrder[filterBarValues.orderBy],
            //direction: undefined,
            includeArtists: filterBarValues.includeArtists && filterBarValues.includeArtists.length > 0 ? [...filterBarValues.includeArtists] : undefined, // unpack artists into new table so that the reference is different
            excludeArtists: filterBarValues.excludeArtists && filterBarValues.excludeArtists.length > 0 ? [...filterBarValues.excludeArtists] : undefined,
            includeArtistsMode: filterBarValues.includeArtistsMode == undefined ? undefined : FilterInclusionMode[filterBarValues.includeArtistsMode],
            excludeArtistsMode: filterBarValues.excludeArtistsMode == undefined ? undefined : FilterInclusionMode[filterBarValues.excludeArtistsMode],
            includeSimilarArtists: filterBarValues.includeSimilarArtists,
            //songs: undefined,
            singleVideo: filterBarValues.singleVideo,
            minViews: filterBarValues.minViews ? Number(filterBarValues.minViews) : undefined,
            maxViews: filterBarValues.maxViews ? Number(filterBarValues.maxViews) : undefined,
            search: filterBarValues.search == '' ? undefined : filterBarValues.search
        }
    }

    // import graphql context
    const [queryVariables, setQueryVariables] = useState(getQueryVariables)
    const { loading, error, data } = useQuery(GET_SONG_RANKINGS, {
        variables: queryVariables
    })
    const rankingsResult = data?.songRankings as ApiSongRankingsFilterResult

    // function for saving filter values & updating the UI with the new values.
    function saveFilterValues(
        newValues: SongRankingsFilterBarValues,
        refresh: boolean = true,
        merge: boolean = true
    ) {
        filterBarValues = merge ? { ...newValues } : newValues
        setFilterValues(filterBarValues)
        // set url
        if (refresh) {
            const queryBuilder = []
            for (const key in filterBarValues) {
                const value = filterBarValues[key as keyof typeof filterBarValues]
                const filter = filters[key as keyof typeof filters]
                if (value != undefined && filter) {
                    switch (filter.type) {
                        case FilterType.SELECT:
                        case FilterType.INPUT:
                            if (value != (filter as InputFilter).defaultValue) queryBuilder.push(`${key}=${value}`)
                            break
                        case FilterType.CHECKBOX:
                            if (value) queryBuilder.push(`${key}=${encodeBoolean(value as boolean)}`)
                            break
                        case FilterType.MULTI_ENTITY:
                        case FilterType.MULTI:
                            const encoded = encodeMultiFilter(value as number[])
                            if (encoded != '') queryBuilder.push(`${key}=${encoded}`)
                            break
                        case FilterType.TIMESTAMP:
                            queryBuilder.push(`${key}=${(value as Date).toISOString()}`)
                            break
                    }
                }
            }
            history.pushState({}, 'Song rankings filter changed.', `${href}?${queryBuilder.join('&')}`)
            setQueryVariables(getQueryVariables())
        }
    }

    // load entity names map
    useEffect(() => {
        const artists = [...(filterBarValues.includeArtists || []), ...(filterBarValues.excludeArtists || [])]
        if (artists && artists.length > 0) {
            graphClient.query({
                query: GET_ARTISTS_NAMES,
                variables: {
                    ids: artists
                }
            }).then((result: ApolloQueryResult<any>) => {
                if (!result.error) {
                    const nameMap: EntityNames = {}
                    for (const artist of result.data.artists as ApiArtist[]) {
                        nameMap[artist.id] = getEntityName(buildEntityNames(artist.names), settingTitleLanguage)
                    }
                    setEntityNames({ ...entityNames, ...nameMap })
                }
            }).catch(_ => { })
        }
    }, [settingTitleLanguage])

    // load view mode
    useEffect(() => {
        setViewMode(settings.rankingsViewMode)
    }, [settings.rankingsViewMode])

    // generate dummy rankings
    const dummyElements: JSX.Element[] = []
    if (loading) {
        for (let i = 0; i < 50; i++) {
            dummyElements.push(<DummyRankingsListItem keyValue={i} />)
        }
    }

    return (
        <section className="flex flex-col gap-5 w-full">
            <SongRankingsActiveFilterBar
                filters={filters}
                langDict={langDict}
                filterValues={filterBarValues}
                currentTimestamp={currentTimestampDate}
                setFilterValues={saveFilterValues}
                setRankingsViewMode={setRankingsViewMode}
                entityNames={entityNames}
                onEntityNamesChanged={newNames => setEntityNames({ ...newNames })}
            />
            <Divider />
            {error ? <h2 className="text-3xl font-bold text-center text-on-background">{error.message}</h2>
                : !loading && 0 >= rankingsResult.results.length ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2>
                    : <ol key='list-view' className={rankingsViewMode == RankingsViewMode.LIST ? "flex flex-col gap-5 w-full" : "grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-10 w-full mt-3"}>
                        {rankingsResult == undefined ? dummyElements : <TransitionGroup component={null}>{rankingsResult.results.map(ranking => {
                            const song = ranking.song
                            const names = buildEntityNames(song.names)

                            const artistsLabel = <SongArtistsLabel artists={song.artists} preferredNameType={settingTitleLanguage} />

                            return rankingsViewMode == RankingsViewMode.LIST ? (
                                <RankingListItem
                                    key={song.id.toString()}
                                    href={`song/${song.id}`}
                                    titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                    placement={ranking.placement}
                                    icon={song.thumbnail}
                                    iconAlt={getEntityName(names, settingTitleLanguage)}
                                    trailingTitleContent={<NumberFormatter number={ranking.views} />}
                                    trailingSupporting={langDict.rankings_views}
                                    supportingContent={artistsLabel}
                                />
                            ) : (
                                <RankingsGridItem
                                    key={song.id.toString()}
                                    href={`song/${song.id}`}
                                    titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                    placement={ranking.placement}
                                    icon={song.thumbnail}
                                    iconAlt={getEntityName(names, settingTitleLanguage)}
                                    trailingTitleContent={<NumberFormatter number={ranking.views} />}
                                    trailingSupporting={langDict.rankings_views}
                                    supportingContent={artistsLabel}
                                    color={resolvedTheme == 'dark' ? song.darkColor : song.lightColor}
                                />
                            )
                        })}</TransitionGroup>}
                    </ol>
            }
        </section>
    )
}