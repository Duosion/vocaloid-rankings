import { getMostRecentViewsTimestamp } from "@/data/songsData"
import { FilterDirection } from "@/data/types"
import { generateTimestamp } from "@/lib/utils"
import { Locale, getDictionary } from "@/localization"
import { cookies } from "next/dist/client/components/headers"
import { Settings } from "../../settings"
import { TrendingRankingsList } from "../trending-rankings-list"
import { ArtistRankingsFiltersValues, FilterType, TrendingFilters } from "../types"

const filters: TrendingFilters = {
    timePeriod: {
        name: 'filter_time_period_offset',
        key: 'timePeriod',
        displayActive: true,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_time_period_offset_day', value: 1 },
            { name: 'filter_time_period_offset_week', value: 7 },
            { name: 'filter_time_period_offset_month', value: 30 },
            { name: 'filter_time_period_offset_custom', value: 1 }
        ],
        defaultValue: 0
    },
    from: {
        name: 'filter_time_period_offset_custom_from',
        key: 'from',
        displayActive: true,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    timestamp: {
        name: 'filter_timestamp',
        key: 'timestamp',
        displayActive: true,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    direction: {
        name: 'filter_direction',
        key: 'direction',
        displayActive: false,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_direction_descending', value: FilterDirection.DESCENDING },
            { name: 'filter_direction_ascending', value: FilterDirection.ASCENDING }
        ],
        defaultValue: 0 // default value
    },
    startAt: {
        name: 'filter_artist_type',
        key: 'startAt',
        displayActive: false,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    }
}

export default async function RankingsPage(
    {
        params,
        searchParams
    }: {
        params: {
            lang: Locale
        },
        searchParams: ArtistRankingsFiltersValues
    }
) {
    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const viewMode = settings.rankingsViewMode

    const mostRecentTimestamp = (await getMostRecentViewsTimestamp()) || generateTimestamp()

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen">
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.trending_page_title}</h1>
            <TrendingRankingsList
                href=''
                filters={filters}
                filterValues={searchParams}
                currentTimestamp={mostRecentTimestamp}
                viewMode={viewMode}
            />
        </section>
    )

}