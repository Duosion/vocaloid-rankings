import { filterSongRankings, getMostRecentViewsTimestamp } from "@/data/songsData"
import { ArtistCategory, ArtistType, FilterOrder, SongRankingsFilterParams, SongType, SourceType } from "@/data/types"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { cookies } from "next/dist/client/components/headers"
import Link from "next/link"
import { Settings } from "../settings"
import { SongRankingsFilterBar } from "./song-rankings-filter-bar"
import { FilterType, SongRankingsFiltersValues, RankingsFilters, SelectFilterValue } from "./types"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import SongThumbnail from "@/components/song-thumbnail"
import Image from "next/image"
import { Metadata } from "next"

const filters: RankingsFilters = {
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
            { name: 'filter_time_period_offset_custom', value: null}
        ],
        defaultValue: 0
    },
    publishYear: {
        name: 'filter_year',
        key: 'publishYear',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    publishMonth: {
        name: 'filter_month',
        key: 'publishMonth',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    publishDay: {
        name: 'filter_day',
        key: 'publishDay',
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
            { name: 'filter_artist_type_vocaloid', value: ArtistType.VOCALOID },
            { name: 'filter_artist_type_cevio', value: ArtistType.CEVIO },
            { name: 'filter_artist_type_synth_v', value: ArtistType.SYNTHESIZER_V },
            { name: 'filter_artist_type_illustrator', value: ArtistType.ILLUSTRATOR },
            { name: 'filter_artist_type_cover_artist', value: ArtistType.COVER_ARTIST },
            { name: 'filter_artist_type_animator', value: ArtistType.ANIMATOR },
            { name: 'filter_artist_type_producer', value: ArtistType.PRODUCER },
            { name: 'filter_artist_type_other_vocalist', value: ArtistType.OTHER_VOCALIST },
            { name: 'filter_artist_type_other_voice_synth', value: ArtistType.OTHER_VOICE_SYNTHESIZER },
            { name: 'filter_artist_type_other_individual', value: ArtistType.OTHER_INDIVIDUAL },
            { name: 'filter_artist_type_other_group', value: ArtistType.OTHER_GROUP },
            { name: 'filter_artist_type_utau', value: ArtistType.UTAU },
        ]
    },
    excludeArtistTypes: {
        name: 'filter_artist_type_exclude', // name
        key: 'excludeArtistTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_artist_type_vocaloid', value: ArtistType.VOCALOID },
            { name: 'filter_artist_type_cevio', value: ArtistType.CEVIO },
            { name: 'filter_artist_type_synth_v', value: ArtistType.SYNTHESIZER_V },
            { name: 'filter_artist_type_illustrator', value: ArtistType.ILLUSTRATOR },
            { name: 'filter_artist_type_cover_artist', value: ArtistType.COVER_ARTIST },
            { name: 'filter_artist_type_animator', value: ArtistType.ANIMATOR },
            { name: 'filter_artist_type_producer', value: ArtistType.PRODUCER },
            { name: 'filter_artist_type_other_vocalist', value: ArtistType.OTHER_VOCALIST },
            { name: 'filter_artist_type_other_voice_synth', value: ArtistType.OTHER_VOICE_SYNTHESIZER },
            { name: 'filter_artist_type_other_individual', value: ArtistType.OTHER_INDIVIDUAL },
            { name: 'filter_artist_type_other_group', value: ArtistType.OTHER_GROUP },
            { name: 'filter_artist_type_utau', value: ArtistType.UTAU },
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
    timestamp: {
        name: 'filter_timestamp',
        key: 'timestamp',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_timestamp_latest',
        defaultValue: ''
    },
    singleVideo: {
        name: 'filter_single_video_single',
        key: 'singleVideo',
        displayActive: true,
        type: FilterType.CHECKBOX,
        defaultValue: false
    }
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

function parseParamMultiFilterValue(
    paramValue: string | undefined,
    values: SelectFilterValue<number>[],
    separator: string = ','
): number[] | undefined {
    const ids: number[] = []

    paramValue?.split(separator).map(value => {
        const parsed = parseParamSelectFilterValue(Number(value), values)
        if (parsed != undefined && !isNaN(parsed)) {
            ids.push(parsed)
        }
    })

    return 0 >= ids.length ? undefined : ids
}

function parseParamCheckboxFilterValue(
    paramValue: number | undefined,
): boolean {
    const paramNum = Number(paramValue)
    return !isNaN(paramNum) && paramNum == 1
}

export async function generateMetadata(
    {
      params
    }: {
      params: {
        lang: Locale
      }
    }
  ): Promise<Metadata> {
    const langDict = await getDictionary(params.lang)
  
    return {
      title: langDict.nav_rankings
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
        searchParams: SongRankingsFiltersValues
    }
) {
    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const settingTitleLanguage = settings.titleLanguage

    // build filterParams
    const filterParams = new SongRankingsFilterParams()
    {
        {
            const search = searchParams.search
            if (search) {
                filterParams.search = `%${search}%`
            }
        }

        filterParams.timePeriodOffset = parseParamSelectFilterValue(Number(searchParams.timePeriod), filters.timePeriod.values, filters.timePeriod.defaultValue) as number
        {
            const yearParam = searchParams.publishYear
            const monthParam = searchParams.publishMonth
            const dayParam = searchParams.publishDay

            const year = !yearParam || isNaN(Number(yearParam)) ? '%' : yearParam
            const month = !monthParam || isNaN(Number(monthParam)) ? '%' : monthParam.padStart(2, '0')
            const day = !dayParam || isNaN(Number(dayParam)) ? '%' : dayParam.padStart(2, '0')
            filterParams.publishDate = `${year}-${month}-${day}%`
        }
        // source types
        filterParams.includeSourceTypes = parseParamMultiFilterValue(searchParams.includeSourceTypes, filters.includeSourceTypes.values) as SourceType[] | undefined
        filterParams.excludeSourceTypes = parseParamMultiFilterValue(searchParams.excludeSourceTypes, filters.excludeSourceTypes.values) as SourceType[] | undefined
        // song types
        filterParams.includeSongTypes = parseParamMultiFilterValue(searchParams.includeSongTypes, filters.includeSongTypes.values) as SongType[] | undefined
        filterParams.excludeSongTypes = parseParamMultiFilterValue(searchParams.excludeSongTypes, filters.excludeSongTypes.values) as SongType[] | undefined
        // artist types
        filterParams.includeArtistTypes = parseParamMultiFilterValue(searchParams.includeArtistTypes, filters.includeArtistTypes.values) as ArtistType[] | undefined
        filterParams.excludeArtistTypes = parseParamMultiFilterValue(searchParams.excludeArtistTypes, filters.excludeArtistTypes.values) as ArtistType[] | undefined
        {
            const minViews = Number(searchParams.minViews)
            const maxViews = Number(searchParams.maxViews)
            filterParams.minViews = isNaN(minViews) ? undefined : minViews
            filterParams.maxViews = isNaN(maxViews) ? undefined : maxViews
        }
        filterParams.orderBy = parseParamSelectFilterValue(Number(searchParams.orderBy), filters.orderBy.values, filters.orderBy.defaultValue) as FilterOrder
        filterParams.timestamp = searchParams.timestamp
        filterParams.singleVideo = parseParamCheckboxFilterValue(searchParams.singleVideo)
    }

    const rankings = await filterSongRankings(filterParams)
    const mostRecentTimestamp = await getMostRecentViewsTimestamp() || rankings.timestamp

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen">
            <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full">{langDict.rankings_page_title}</h1>
            <SongRankingsFilterBar href='' filters={filters} langDict={langDict} values={searchParams} currentTimestamp={mostRecentTimestamp} />
            <ol className="flex flex-col gap-5 w-full">
                {0 >= rankings.totalCount ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2> : rankings.results.map(ranking => {
                    const song = ranking.song

                    // generate artist links
                    const artistLinks: React.ReactNode[] = []
                    for (const artist of song.artists) {
                        if (artist.category == ArtistCategory.PRODUCER) {
                            artistLinks.push(
                                <Link href={`/${lang}/artist/${song.id}`} className="text-md text-on-surface-variant"><EntityName names={artist.names} preferred={settingTitleLanguage} /></Link>
                            )
                            if (artistLinks.length == 3) {
                                break
                            }
                        }
                    }

                    const names = song.names

                    return (
                        <Ranking
                            key={song.id.toString()}
                            href={`/${lang}/song/${song.id}`}
                            titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                            placement={ranking.placement}
                            icon={song.thumbnail}
                            iconAlt={getEntityName(names, settingTitleLanguage)}
                            trailingTitleContent={<NumberFormatter number={ranking.views} />}
                            trailingSupporting={langDict.rankings_views}
                            supportingContent={<span className="flex flex-row gap-3">{artistLinks}</span>}
                        />
                    )
                })}
            </ol>
        </section>
    )
}

function Ranking(
    {
        key,
        href,
        titleContent,
        placement,
        icon,
        iconAlt,
        trailingTitleContent,
        supportingContent,
        trailingSupporting,
        className = ''
    }: {
        key: string
        href: string
        titleContent: React.ReactNode
        placement: number
        icon: string
        iconAlt: string
        trailingTitleContent: React.ReactNode,
        supportingContent?: React.ReactNode
        trailingSupporting?: string,
        className?: string
    }
) {
    return (
        <li key={key} className={`py-2 rounded-2xl w-full flex gap-3 bg-surface-container-low box-border items-center ${className}`}>
            <b className="ml-3 text-on-surface h-10 w-fit min-w-[40px] box-border flex items-center justify-center text-2xl font-extrabold">{placement}</b>
            <Link href={href} className="rounded-xl border border-outline-variant box-border"><SongThumbnail src={icon} alt={iconAlt} width={50} height={50} overflowHeight={70} overflowWidth={70} /></Link>
            <section className="flex flex-col gap flex-1">
                <h3><Link href={href} className="text-on-surface font-semibold text-xl">{titleContent}</Link></h3>
                {supportingContent}
            </section>
            <section className="flex flex-col gap items-end mr-4">
                <h3 className="text-on-surface text-xl font-semibold">{trailingTitleContent}</h3>
                <span className="text-on-surface-variant text-md">{trailingSupporting}</span>
            </section>
        </li>
    )
}

function RankingCard(
    {
        key,
        href,
        titleContent,
        placement,
        icon,
        iconAlt,
        trailingTitleContent,
        supportingContent,
        trailingSupporting,
        className = ''
    }: {
        key: string
        href: string
        titleContent: React.ReactNode
        placement: number
        icon: string
        iconAlt: string
        trailingTitleContent: React.ReactNode,
        supportingContent?: React.ReactNode
        trailingSupporting?: string,
        className?: string
    }
) {
    return (
        <li key={key}><article className="flex flex-col gap-3">
            <Link href={href}><figure className="w-full h-auto aspect-video overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant">
                <Image
                    fill
                    src={icon}
                    alt={iconAlt}
                    className="object-cover"
                />
            </figure></Link>
            <section className="flex flex-col gap-2">
                <h3 className="text-on-surface text-2xl flex gap-2"><b className="font-bold">#{placement}</b><Link href={href} className="flex-1 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{titleContent}</Link></h3>
                <section className="flex gap-1 text-xl">
                    <h5>{trailingTitleContent}</h5>
                    <h5>{trailingSupporting}</h5>
                </section>
            </section>
        </article></li>
    )
}