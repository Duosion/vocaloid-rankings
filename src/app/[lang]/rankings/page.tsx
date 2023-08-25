import { EntityName, NumberFormatter } from "@/components/formatters"
import SongThumbnail from "@/components/song_thumbnail"
import { filterRankings } from "@/data/songsData"
import { ArtistCategory, RankingsFilterParams, SongType, SourceType } from "@/data/types"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { cookies } from "next/dist/client/components/headers"
import Link from "next/link"
import { Settings } from "../settings"
import { FilterBar } from "./client"
import { Filter, FilterBarFilters, FilterBarSelectFilter, FilterType, RankingsFilterSearchParams, RankingsFilters, SelectFilter, SelectFilterValue } from "./types"

export const filters: RankingsFilters = {
    songType: new SelectFilter<SongType>(
        'filter_song_type', // name
        [
            { name: 'filter_song_type_all', value: null },
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_other', value: SongType.OTHER },
        ],
        0 // default value
    ),
    sourceType: new SelectFilter<SourceType>(
        'filter_view_type',
        [
            { name: 'filter_view_type_combined', value: null },
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ],
        0
    )
}

function parseFilterParamKey(
    paramValue: number | undefined,
    cookieValue: number | undefined,
    defaultValue: number
): number {
    const paramValueNumber = Number(paramValue)
    const cookieValueNumber = Number(cookieValue)
    const valueNumber = isNaN(paramValueNumber) ? cookieValueNumber : paramValueNumber
    return isNaN(valueNumber) ? defaultValue : valueNumber
}

function parseParamSelectFilterValue(
    paramValue: number | undefined,
    cookieValue: number | undefined,
    values: SelectFilterValue<number>[],
    defaultValue: number
): number | null {
    // get the filterValue and return it
    const valueNumber = parseFilterParamKey(paramValue, cookieValue, defaultValue)
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
        searchParams: RankingsFilterSearchParams
    }
) {
    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const settingTitleLanguage = settings.titleLanguage
    const rankingsFilterCookie = settings.rankingsFilter

    // build filterParams
    const filterParams = new RankingsFilterParams()
    {
        filterParams.sourceType = parseParamSelectFilterValue(searchParams.sourceType, rankingsFilterCookie.sourceType, filters.sourceType.values, filters.sourceType.defaultValue) as SourceType
        filterParams.songType = parseParamSelectFilterValue(searchParams.songType, rankingsFilterCookie.songType,filters.songType.values, filters.songType.defaultValue) as SongType
    }
    const rankings = await filterRankings(filterParams)

    // convert filters to filter bar filters
    const filterBarFilters: FilterBarFilters = []
    for (const filterKey in filters) {
        const filter = filters[filterKey as keyof typeof filters] as Filter
        const name = filter.name
        const type = filter.type

        switch (type) {
            case FilterType.SELECT: {
                const selectFilter = filter as SelectFilter<number>
                const defaultValue = selectFilter.defaultValue
                filterBarFilters.push({
                    key: filterKey,
                    name: langDict[name],
                    type: type,
                    values: selectFilter.values.map(value => langDict[value.name]),
                    value: parseFilterParamKey(searchParams[filterKey as keyof typeof searchParams], rankingsFilterCookie[filterKey as keyof typeof rankingsFilterCookie], defaultValue),
                    defaultValue: defaultValue
                } as FilterBarSelectFilter)
            }
        }
    }

    return (
        <section className="flex flex-col gap-5 w-full">
            <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full">{langDict.rankings_page_title}</h1>
            <FilterBar href='' filters={filterBarFilters} />
            <ol className="flex flex-col gap-3 w-full">
                {rankings.results.map(ranking => {
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
                <h3 className="text-on-surface text-xl font-bold">{trailingTitleContent}</h3>
                <span className="text-on-surface-variant text-md">{trailingSupporting}</span>
            </section>
        </li>
    )
}