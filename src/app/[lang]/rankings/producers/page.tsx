import { getMostRecentViewsTimestamp } from "@/data/songsData"
import { ArtistCategory, ArtistType, FilterOrder, SongType, SourceType } from "@/data/types"
import { generateTimestamp } from "@/lib/utils"
import { Locale, getDictionary } from "@/localization"
import { cookies } from "next/dist/client/components/headers"
import { Settings } from "../../settings"
import { ArtistRankingsFilters, ArtistRankingsFiltersValues, FilterType } from "../types"
import { ArtistRankingsList } from "../artist-rankings-filters"

const filters: ArtistRankingsFilters = {
    search: {
        name: 'search_hint',
        key: 'search',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'search_hint',
        defaultValue: ''
    },
    timePeriod: {
        name: 'filter_time_period_offset',
        key: 'timePeriod',
        displayActive: true,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_time_period_offset_all_time', value: null },
            { name: 'filter_time_period_offset_day', value: 1 },
            { name: 'filter_time_period_offset_week', value: 7 },
            { name: 'filter_time_period_offset_month', value: 30 },
            { name: 'filter_time_period_offset_custom', value: null }
        ],
        defaultValue: 0
    },
    songPublishYear: {
        name: 'artist_filter_song_year',
        key: 'songPublishYear',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    songPublishMonth: {
        name: 'artist_filter_song_month',
        key: 'songPublishMonth',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    songPublishDay: {
        name: 'artist_filter_song_day',
        key: 'songPublishDay',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseYear: {
        name: 'artist_filter_year',
        key: 'releaseYear',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseMonth: {
        name: 'artist_filter_month',
        key: 'releaseMonth',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseDay: {
        name: 'artist_filter_day',
        key: 'releaseDay',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    includeSourceTypes: {
        name: 'filter_view_type',
        key: 'includeSourceTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ]
    },
    excludeSourceTypes: {
        name: 'filter_view_type_exclude',
        key: 'excludeSourceTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ]
    },
    includeSongTypes: {
        name: 'filter_song_type', // name
        key: 'includeSongTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_other', value: SongType.OTHER },
        ]
    },
    excludeSongTypes: {
        name: 'filter_song_type_exclude', // name
        key: 'excludeSongTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_other', value: SongType.OTHER },
        ]
    },
    includeArtistTypes: {
        name: 'filter_artist_type', // name
        key: 'includeArtistTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_artist_type_illustrator', value: ArtistType.ILLUSTRATOR },
            { name: 'filter_artist_type_cover_artist', value: ArtistType.COVER_ARTIST },
            { name: 'filter_artist_type_animator', value: ArtistType.ANIMATOR },
            { name: 'filter_artist_type_producer', value: ArtistType.PRODUCER },
            { name: 'filter_artist_type_other_individual', value: ArtistType.OTHER_INDIVIDUAL },
            { name: 'filter_artist_type_other_group', value: ArtistType.OTHER_GROUP },
        ],
        defaultValue: [
            ArtistType[ArtistType.ILLUSTRATOR],
            ArtistType[ArtistType.COVER_ARTIST],
            ArtistType[ArtistType.ANIMATOR],
            ArtistType[ArtistType.PRODUCER],
            ArtistType[ArtistType.OTHER_INDIVIDUAL],
            ArtistType[ArtistType.OTHER_GROUP]
        ]
    },
    excludeArtistTypes: {
        name: 'filter_artist_type_exclude', // name
        key: 'excludeArtistTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_artist_type_illustrator', value: ArtistType.ILLUSTRATOR },
            { name: 'filter_artist_type_cover_artist', value: ArtistType.COVER_ARTIST },
            { name: 'filter_artist_type_animator', value: ArtistType.ANIMATOR },
            { name: 'filter_artist_type_producer', value: ArtistType.PRODUCER },
            { name: 'filter_artist_type_other_individual', value: ArtistType.OTHER_INDIVIDUAL },
            { name: 'filter_artist_type_other_group', value: ArtistType.OTHER_GROUP },
        ]
    },
    minViews: {
        name: 'filter_min_views',
        key: 'minViews',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    },
    maxViews: {
        name: 'filter_max_views',
        key: 'maxViews',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    },
    orderBy: {
        name: 'filter_order_by',
        key: 'orderBy',
        displayActive: false,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_order_by_views', value: FilterOrder.VIEWS },
            { name: 'filter_order_by_publish', value: FilterOrder.PUBLISH_DATE },
            { name: 'filter_order_by_addition', value: FilterOrder.ADDITION_DATE }
        ],
        defaultValue: 0 // default value
    },
    from: {
        name: 'filter_time_period_offset_custom_from',
        key: 'from',
        displayActive: true,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    to: {
        name: 'filter_time_period_offset_custom_to',
        key: 'to',
        displayActive: false,
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
    singleVideo: {
        name: 'filter_single_video_single',
        key: 'singleVideo',
        displayActive: true,
        type: FilterType.CHECKBOX,
        defaultValue: false
    },
    includeArtists: {
        name: 'filter_artists',
        key: 'includeArtists',
        displayActive: true,
        type: FilterType.MULTI_ENTITY,
        placeholder: 'filter_artists_placeholder',
    },
    excludeArtists: {
        name: 'filter_exclude_artists',
        key: 'excludeArtists',
        displayActive: true,
        type: FilterType.MULTI_ENTITY,
        placeholder: 'filter_artists_placeholder',
    },
    combineSimilarArtists: {
        name: 'filter_combine_similar_artists',
        key: 'combineSimilarArtists',
        displayActive: true,
        type: FilterType.CHECKBOX,
        defaultValue: false
    },
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
            <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full">{langDict.producer_rankings_page_title}</h1>
            <ArtistRankingsList
                href=''
                filters={filters}
                langDict={langDict}
                filterValues={searchParams}
                currentTimestamp={mostRecentTimestamp}
                viewMode={viewMode}
                category={ArtistCategory.PRODUCER}
            />
        </section>
    )

}