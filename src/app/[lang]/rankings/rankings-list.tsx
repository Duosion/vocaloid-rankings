'use client'
import { EntityName } from "@/components/formatters/entity-name"
import { SongArtistsLabel } from "@/components/formatters/song-artists-label"
import { Divider } from "@/components/material/divider"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { RankingsApiError } from "@/components/rankings/rankings-api-error"
import { RankingsContainer } from "@/components/rankings/rankings-container"
import { RankingsItemTrailing } from "@/components/rankings/rankings-item-trailing"
import { RankingListItem } from "@/components/rankings/rankings-list-item"
import { RankingsPageSelector } from "@/components/rankings/rankings-page-selector"
import { RankingsSkeleton } from "@/components/rankings/rankings-skeleton"
import { TransitioningRankingsGridItem } from "@/components/rankings/transitioning-rankings-grid-item"
import { ArtistType, FilterDirection, FilterInclusionMode, FilterOrder, SongType, SourceType } from "@/data/types"
import { GET_SONG_RANKINGS, buildEntityNames, graphClient } from "@/lib/api"
import { ApiArtist, ApiSongRankingsFilterResult } from "@/lib/api/types"
import { buildFuzzyDate } from "@/lib/utils"
import { getEntityName } from "@/localization"
import { Result, useQuery } from "graphql-hooks"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { TransitionGroup } from "react-transition-group"
import { useSettings } from "../../../components/providers/settings-provider"
import { SongRankingsFilterBar } from "./song-rankings-filter-bar"
import { EntityNames, FilterType, InputFilter, RankingsFilters, RankingsViewMode, SongRankingsFilterBarValues, SongRankingsFiltersValues } from "./types"
import { decodeBoolean, decodeMultiFilter, encodeBoolean, encodeMultiFilter, getRankingsItemTrailingSupportingText, parseParamSelectFilterValue } from "./utils"

const GET_ARTISTS_NAMES = `
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

export function RankingsList(
    {
        href,
        filters,
        filterValues,
        currentTimestamp,
        viewMode
    }: {
        href: string
        filters: RankingsFilters
        filterValues: SongRankingsFiltersValues
        currentTimestamp: string
        viewMode: RankingsViewMode
    }
) {
    // import contexts
    const { settings, setRankingsViewMode } = useSettings()
    const { resolvedTheme } = useTheme()
    const langDict = useLocale()

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
        includeSimilarArtists: decodeBoolean(Number(filterValues.includeSimilarArtists)),
        direction: filterValues.direction,
        startAt: filterValues.startAt,
        list: filterValues.list
    } as SongRankingsFilterBarValues)

    // entity names state
    const [entityNames, setEntityNames] = useState({} as EntityNames)

    // returns a table of query variables for querying GraphQL with.
    const getQueryVariables = () => {
        // build & set query variables
        const includeSourceTypes = filterBarValues.includeSourceTypes?.map(type => SourceType[filters.includeSourceTypes.values[type].value || 0])
        const excludeSourceTypes = filterBarValues.excludeSourceTypes?.map(type => SourceType[filters.excludeSourceTypes.values[type].value || 0])
        const includeSongTypes = filterBarValues.includeSongTypes?.map(type => SongType[filters.includeSongTypes.values[type].value || 0])
        const excludeSongTypes = filterBarValues.excludeSongTypes?.map(type => SongType[filters.excludeSongTypes.values[type].value || 0])
        const includeArtistTypes = filterBarValues.includeArtistTypes?.map(type => ArtistType[filters.includeArtistTypes.values[type].value || 0])
        const excludeArtistTypes = filterBarValues.excludeArtistTypes?.map(type => ArtistType[filters.excludeArtistTypes.values[type].value || 0])

        // build publish date
        const publishYear = filterBarValues.publishYear
        const publishMonth = filterBarValues.publishMonth
        const publishDay = filterBarValues.publishDay

        const publishDate = (publishYear || publishMonth || publishDay) ? buildFuzzyDate(publishYear, publishMonth, publishDay) : undefined

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
            includeArtists: filterBarValues.includeArtists && filterBarValues.includeArtists.length > 0 ? [...filterBarValues.includeArtists] : undefined, // unpack artists into new table so that the reference is different
            excludeArtists: filterBarValues.excludeArtists && filterBarValues.excludeArtists.length > 0 ? [...filterBarValues.excludeArtists] : undefined,
            includeArtistsMode: filterBarValues.includeArtistsMode == undefined ? undefined : FilterInclusionMode[filterBarValues.includeArtistsMode],
            excludeArtistsMode: filterBarValues.excludeArtistsMode == undefined ? undefined : FilterInclusionMode[filterBarValues.excludeArtistsMode],
            includeSimilarArtists: filterBarValues.includeSimilarArtists,
            singleVideo: filterBarValues.singleVideo,
            minViews: filterBarValues.minViews ? Number(filterBarValues.minViews) : undefined,
            maxViews: filterBarValues.maxViews ? Number(filterBarValues.maxViews) : undefined,
            search: filterBarValues.search == '' ? undefined : filterBarValues.search,
            direction: filterBarValues.direction === undefined ? undefined : FilterDirection[filterBarValues.direction],
            startAt: Number(filterBarValues.startAt),
            list: filterBarValues.list
        }
    }

    // import graphql context
    const [queryVariables, setQueryVariables] = useState(getQueryVariables)
    const { loading, error, data } = useQuery(GET_SONG_RANKINGS, {
        variables: queryVariables
    })
    const rankingsResult = data?.songRankings as ApiSongRankingsFilterResult | undefined

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
            graphClient.request({
                query: GET_ARTISTS_NAMES,
                variables: {
                    ids: artists
                }
            }).then((result: Result<any, any>) => {
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

    // calculate the filter mode
    const filterMode = filters.orderBy.values[filterBarValues.orderBy || filters.orderBy.defaultValue].value || FilterOrder.VIEWS

    return (
        <section className="flex flex-col w-full">
            <SongRankingsFilterBar
                filters={filters}
                filterValues={filterBarValues}
                currentTimestamp={currentTimestampDate}
                setFilterValues={(newValues, route, merge) => {
                    //filterBarValues.startAt = '0'
                    saveFilterValues(newValues, route, merge)
                }}
                setRankingsViewMode={setRankingsViewMode}
                entityNames={entityNames}
                setEntityNames={newNames => setEntityNames({ ...newNames })}
            />
            <Divider className="mb-5"/>
            
            {error ? <RankingsApiError error={error}/>
                : !loading && (rankingsResult == undefined || 0 >= rankingsResult.results.length) ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2>
                    : rankingsResult == undefined ? <RankingsSkeleton elementCount={50} viewMode={rankingsViewMode} />
                        : <RankingsContainer viewMode={rankingsViewMode}>
                            <TransitionGroup component={null}>{rankingsResult.results.map(ranking => {
                                const song = ranking.song
                                const names = buildEntityNames(song.names)

                                const color = resolvedTheme == 'dark' ? song.darkColor : song.lightColor

                                const trailing = <RankingsItemTrailing
                                    mode={filterMode}
                                    value={ranking.views}
                                    publishDate={song.publishDate}
                                    additionDate={song.additionDate}
                                />

                                const trailingSupporting = getRankingsItemTrailingSupportingText(filterMode, langDict.rankings_views, undefined, langDict.rankings_publish_date, langDict.rankings_addition_date)

                                return rankingsViewMode == RankingsViewMode.LIST ? (
                                    <RankingListItem
                                        key={song.id.toString()}
                                        href={`/song/${song.id}`}
                                        titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        placement={ranking.placement}
                                        icon={song.thumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        trailingTitleContent={trailing}
                                        trailingSupporting={trailingSupporting}
                                        supportingContent={<SongArtistsLabel artists={song.artists} categories={song.artistsCategories} preferredNameType={settingTitleLanguage} theme={resolvedTheme} />}
                                        color={color}
                                    />
                                ) : (
                                    <TransitioningRankingsGridItem
                                        key={song.id.toString()}
                                        href={`/song/${song.id}`}
                                        titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        placement={ranking.placement}
                                        icon={song.thumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        trailingTitleContent={trailing}
                                        trailingSupporting={trailingSupporting}
                                        color={color}
                                    />
                                )
                            })}</TransitionGroup>
                        </RankingsContainer>
            }
            <RankingsPageSelector
                currentOffset={ Number(filterBarValues.startAt)}
                totalCount={rankingsResult?.totalCount}
                onOffsetChanged={(newOffset) => {
                    filterBarValues.startAt = newOffset.toString()
                    saveFilterValues(filterBarValues)
                }}
            />
        </section>
    )
}