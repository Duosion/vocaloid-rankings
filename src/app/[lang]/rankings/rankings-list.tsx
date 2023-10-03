'use client'
import { LanguageDictionary, getEntityName } from "@/localization"
import { EntityNames, FilterType, InputFilter, RankingsFilters, SongRankingsFilterBarValues, SongRankingsFiltersValues } from "./types"
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
import { ArtistType, FilterOrder, SongRankingsFilterResult, SongType, SourceType } from "@/data/types"
import { TransitionGroup } from "react-transition-group"
import { useQuery, gql, ApolloQueryResult } from "@apollo/client"

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
    $publishDate: String
    $orderBy: FilterOrder
    $direction: FilterDirection
    $artists: [Int]
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
        publishDate: $publishDate
        orderBy: $orderBy
        direction: $direction
        artists: $artists
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
        currentTimestamp
    }: {
        href: string
        filters: RankingsFilters
        langDict: LanguageDictionary
        filterValues: SongRankingsFiltersValues
        currentTimestamp: string
    }
) {
    // import contexts
    const { settings } = useSettings()
    const { theme } = useTheme()

    // import settings
    const settingTitleLanguage = settings.titleLanguage

    // convert filterValues into filterBarValues
    const [filterBarValues, setFilterValues] = useState({
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
        minViews: filterValues.minViews,
        maxViews: filterValues.maxViews,
        orderBy: filterValues.orderBy,
        timestamp: filterValues.timestamp,
        singleVideo: decodeBoolean(Number(filterValues.singleVideo)),
        artists: decodeMultiFilter(filterValues.artists)
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
        return {
            timestamp: filterBarValues.timestamp,
            timePeriodOffset: undefined,
            includeSourceTypes: includeSourceTypes && includeSourceTypes.length > 0 ? includeSourceTypes : undefined,
            excludeSourceTypes: excludeSourceTypes && excludeSourceTypes.length > 0 ? excludeSourceTypes : undefined,
            includeSongTypes: includeSongTypes && includeSongTypes.length > 0 ? includeSongTypes : undefined,
            excludeSongTypes: excludeSongTypes && excludeSongTypes.length > 0 ? excludeSongTypes : undefined,
            includeArtistTypes: includeArtistTypes && includeArtistTypes.length > 0 ? includeArtistTypes : undefined,
            excludeArtistTypes: excludeArtistTypes && excludeArtistTypes.length > 0 ? excludeArtistTypes : undefined,
            publishDate: undefined,
            orderBy: filterBarValues.orderBy == undefined ? undefined : FilterOrder[filterBarValues.orderBy],
            direction: undefined,
            artists: filterBarValues.artists && filterBarValues.artists.length > 0 ? filterBarValues.artists : undefined,
            songs: undefined,
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
        refresh: boolean = true
    ) {
        setFilterValues({ ...newValues })
        // set url
        if (refresh) {
            const queryBuilder = []
            for (const key in filterBarValues) {
                const value = filterBarValues[key as keyof typeof filterBarValues]
                const filter = filters[key as keyof typeof filters]
                if (value && filter) {
                    switch (filter.type) {
                        case FilterType.SELECT:
                        case FilterType.INPUT:
                            if (value != (filter as InputFilter).defaultValue) queryBuilder.push(`${key}=${value}`)
                            break
                        case FilterType.CHECKBOX:
                            if (value) queryBuilder.push(`${key}=${encodeBoolean(value as boolean)}`)
                            break
                        case FilterType.MULTI:
                            const encoded = encodeMultiFilter(value as number[])
                            if (encoded != '') queryBuilder.push(`${key}=${encoded}`)
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
        const artists = filterBarValues.artists
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
                        nameMap[artist.id] = buildEntityNames(artist.names)
                    }
                    setEntityNames({ ...entityNames, ...nameMap })
                }
            }).catch(_ => { })
        }
    }, [])

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
                currentTimestamp={currentTimestamp}
                setFilterValues={saveFilterValues}
                entityNames={entityNames}
                onEntityNamesChanged={newNames => setEntityNames({ ...newNames })}
            />
            <ol className="flex flex-col gap-5 w-full">
                {error ? <h2 className="text-3xl font-bold text-center text-on-background">{error.message}</h2>
                    : !loading ? 0 >= rankingsResult.results.length ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2>
                        : <TransitionGroup component={null}>
                            {rankingsResult.results.map(ranking => {
                                const song = ranking.song
                                const names = buildEntityNames(song.names)

                                // generate artist links
                                const artistLinks: React.ReactNode[] = []
                                for (const artist of song.artists) {
                                    if (artist.category == 'PRODUCER') {
                                        const artistNames = buildEntityNames(artist.names)
                                        artistLinks.push(
                                            <Link href={`artist/${song.id}`} className="text-md text-on-surface-variant transition-colors hover:text-on-surface"><EntityName names={artistNames} preferred={settingTitleLanguage} /></Link>
                                        )
                                        if (artistLinks.length == 3) {
                                            break
                                        }
                                    }
                                }
                                return (
                                    <RankingListItem
                                        key={song.id.toString()}
                                        href={`song/${song.id}`}
                                        titleContent={
                                            <div className='text-on-surface transition-colors'>
                                                <EntityName names={names} preferred={settingTitleLanguage} />
                                            </div>
                                        }
                                        placement={ranking.placement}
                                        icon={song.thumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        trailingTitleContent={<NumberFormatter number={ranking.views} />}
                                        trailingSupporting={langDict.rankings_views}
                                        supportingContent={<span className="flex flex-row gap-3">{artistLinks}</span>}
                                    />
                                )
                            })}
                        </TransitionGroup>
                        : dummyElements}
            </ol>
        </section>
    )
}