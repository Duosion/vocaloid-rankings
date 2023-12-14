'use client'
import { ImageDisplayMode } from "@/components"
import { EntityName } from "@/components/formatters/entity-name"
import { Divider } from "@/components/material/divider"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { RankingsApiError } from "@/components/rankings/rankings-api-error"
import { RankingsContainer } from "@/components/rankings/rankings-container"
import { RankingsItemTrailing } from "@/components/rankings/rankings-item-trailing"
import { RankingListItem } from "@/components/rankings/rankings-list-item"
import { RankingsPageSelector } from "@/components/rankings/rankings-page-selector"
import { RankingsSkeleton } from "@/components/rankings/rankings-skeleton"
import { TransitioningRankingsGridItem } from "@/components/rankings/transitioning-rankings-grid-item"
import { FilterDirection, FilterOrder } from "@/data/types"
import { GET_SONG_RANKINGS, buildEntityNames } from "@/lib/api"
import { ApiSongRankingsFilterResult } from "@/lib/api/types"
import { getEntityName } from "@/localization"
import { useQuery } from "graphql-hooks"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { TransitionGroup } from "react-transition-group"
import { useSettings } from "../../../components/providers/settings-provider"
import { TrendingActiveFilterBar } from "./trending-filter-bar"
import { ArtistRankingsFilterBarValues, EntityNames, FilterType, InputFilter, RankingsViewMode, TrendingFilterBarValues, TrendingFilters, TrendingFiltersValues } from "./types"
import { encodeBoolean, encodeMultiFilter, getRankingsItemTrailingSupportingText, parseParamSelectFilterValue } from "./utils"

export function TrendingRankingsList(
    {
        href,
        filters,
        filterValues,
        currentTimestamp,
        viewMode,
    }: {
        href: string
        filters: TrendingFilters
        filterValues: TrendingFiltersValues
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
        timePeriod: filterValues.timePeriod,
        from: filterValues.from ? new Date(filterValues.from) : undefined,
        timestamp: filterValues.timestamp ? new Date(filterValues.timestamp) : undefined,
        direction: filterValues.direction,
        startAt: filterValues.startAt
    } as ArtistRankingsFilterBarValues)

    // entity names state
    const [entityNames, setEntityNames] = useState({} as EntityNames)

    // returns a table of query variables for querying GraphQL with.
    const getQueryVariables = () => {

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
            direction: filterBarValues.direction === undefined ? undefined : FilterDirection[filterBarValues.direction],
            startAt: Number(filterBarValues.startAt),
            orderBy: FilterOrder[FilterOrder.POPULARITY]
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
        newValues: TrendingFilterBarValues,
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
            console.log(getQueryVariables())
            setQueryVariables(getQueryVariables())
        }
    }

    // load view mode
    useEffect(() => {
        setViewMode(settings.rankingsViewMode)
    }, [settings.rankingsViewMode])

    return (
        <section className="flex flex-col w-full">
            <TrendingActiveFilterBar
                filters={filters}
                filterValues={filterBarValues}
                currentTimestamp={currentTimestampDate}
                setFilterValues={saveFilterValues}
                setRankingsViewMode={setRankingsViewMode}
            />
            <Divider className="mb-5" />
            {error ? <RankingsApiError error={error}/>
                : !loading && (rankingsResult == undefined || 0 >= rankingsResult.results.length) ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2>
                    : rankingsResult == undefined ? <RankingsSkeleton elementCount={50} viewMode={rankingsViewMode} />
                        : <RankingsContainer viewMode={rankingsViewMode}>
                            <TransitionGroup component={null}>{rankingsResult.results.map(ranking => {
                                const song = ranking.song
                                const names = buildEntityNames(song.names)

                                const color = resolvedTheme == 'dark' ? song.darkColor : song.lightColor
                                return rankingsViewMode == RankingsViewMode.LIST ? (
                                    <RankingListItem
                                        key={song.id.toString()}
                                        href={`../song/${song.id}`}
                                        titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        placement={ranking.placement}
                                        icon={song.thumbnail || song.maxresThumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        imageDisplayMode={ImageDisplayMode.SONG}
                                        trailingTitleContent={<></>}
                                        color={color}
                                    />
                                ) : (
                                    <TransitioningRankingsGridItem
                                        key={song.id.toString()}
                                        href={`../song/${song.id}`}
                                        titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        placement={ranking.placement}
                                        icon={song.thumbnail || song.maxresThumbnail}
                                        iconAlt={getEntityName(names, settingTitleLanguage)}
                                        imageDisplayMode={ImageDisplayMode.SONG}
                                        trailingTitleContent={<></>}
                                        color={color}
                                    />
                                )
                            })}</TransitionGroup>
                        </RankingsContainer>
            }
            <RankingsPageSelector
                currentOffset={Number(filterBarValues.startAt)}
                totalCount={rankingsResult?.totalCount}
                onOffsetChanged={(newOffset) => {
                    filterBarValues.startAt = newOffset.toString()
                    saveFilterValues(filterBarValues)
                }}
            />
        </section>
    )
}