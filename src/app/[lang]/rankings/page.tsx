import { EntityName, NumberFormatter } from "@/components/formatters"
import SongThumbnail from "@/components/song_thumbnail"
import { filterRankings } from "@/data/songsData"
import { ArtistCategory, ArtistType, RankingsFilterParams, SongType, SourceType } from "@/data/types"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { cookies } from "next/dist/client/components/headers"
import Link from "next/link"
import { Settings } from "../settings"
import { FilterBar } from "./client"
import { FilterType, RankingsFiltersValues, RankingsFilters, SelectFilter, SelectFilterValue } from "./types"

export const filters: RankingsFilters = {
    search: {
        name: 'search_hint',
        key: 'search',
        type: FilterType.INPUT,
        placeholder: 'search_hint',
        defaultValue: ''
    },
    sourceType: {
        name: 'filter_view_type',
        key: 'sourceType',
        type: FilterType.SELECT,
        values: [
            { name: 'filter_view_type_combined', value: null },
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ],
        defaultValue: 0
    },
    timePeriod: {
        name: 'filter_time_period_offset',
        key: 'timePeriod',
        type: FilterType.SELECT,
        values: [
            { name: 'filter_time_period_offset_all_time', value: null },
            { name: 'filter_time_period_offset_day', value: 1 },
            { name: 'filter_time_period_offset_week', value: 7 },
            { name: 'filter_time_period_offset_month', value: 30 }
        ],
        defaultValue: 0
    },
    year: {
        name: 'filter_year',
        key: 'year',
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    songType: {
        name: 'filter_song_type', // name
        key: 'songType',
        type: FilterType.SELECT,
        values: [
            { name: 'filter_song_type_all', value: undefined },
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_other', value: SongType.OTHER },
        ],
        defaultValue: 0 // default value
    },
    artistType: {
        name: 'filter_artist_type', // name
        key: 'artistType',
        type: FilterType.SELECT,
        values: [
            { name: 'filter_artist_type_all', value: undefined },
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
        ],
        defaultValue: 0 // default value
    }
}

function parseFilterParamKey(
    paramValue: number | undefined,
    defaultValue: number
): number {
    const paramValueNumber = Number(paramValue)
    return isNaN(paramValueNumber) ? defaultValue : paramValueNumber
}

function parseParamSelectFilterValue(
    paramValue: number | undefined,
    values: SelectFilterValue<number>[],
    defaultValue: number
): number | null | undefined {
    // get the filterValue and return it
    const valueNumber = parseFilterParamKey(paramValue, defaultValue)
    return (values[valueNumber] || values[defaultValue]).value
}

export default async function RankingsPage(
    {
        params,
        searchParams
    }: {
        params: {
            lang: Locale
        },
        searchParams: RankingsFiltersValues
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
    const filterParams = new RankingsFilterParams()
    {
        {
            const search = searchParams.search
            if (search) {
                filterParams.search = `%${search}%`
            }
        }
        
        filterParams.sourceType = parseParamSelectFilterValue(searchParams.sourceType, filters.sourceType.values, filters.sourceType.defaultValue) as SourceType
        filterParams.timePeriodOffset = parseParamSelectFilterValue(searchParams.timePeriod, filters.timePeriod.values, filters.timePeriod.defaultValue) as number
        {
            const year = Number(searchParams.year)
            filterParams.publishDate = isNaN(year) ? undefined : year + '-%'
        }
        filterParams.songType = parseParamSelectFilterValue(searchParams.songType, filters.songType.values, filters.songType.defaultValue) as SongType
        filterParams.artistType = parseParamSelectFilterValue(searchParams.artistType, filters.artistType.values, filters.artistType.defaultValue) as ArtistType
    }
    const rankings = await filterRankings(filterParams)

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen">
            <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full">{langDict.rankings_page_title}</h1>
            <FilterBar href='' filters={filters} langDict={langDict} values={searchParams} />
            <ol className="flex flex-col gap-3 w-full">
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

export function Ranking(
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