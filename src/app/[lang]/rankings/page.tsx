import { EntityName, NumberFormatter } from "@/components/formatters"
import { filterRankings } from "@/data/songsData"
import { ArtistCategory, RankingsFilterParams, SongType, SourceType } from "@/data/types"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { Settings } from "../settings"
import Link from "next/link"
import { cookies } from "next/dist/client/components/headers"
import SongThumbnail from "@/components/song_thumbnail"
import { Filters, SelectFilter, SelectFilterValue } from "./types"
import { SelectFilterElement } from "./client"
export const filters: Filters = {
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

export default async function RankingsPage(
    {
        params
    }: {
        params: {
            lang: Locale
        }
    }
) {

    // get rankings
    const rankings = await filterRankings(new RankingsFilterParams())

    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const settingTitleLanguage = settings.titleLanguage

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full">{langDict.rankings_page_title}</div>
            <div className="flex gap-3 w-full mt-5">
                <SelectFilterElement name={langDict[filters.songType.name]} defaultValue={filters.songType.defaultValue} values={filters.songType.values.map(value => { return {name: langDict[value.name], value: value.value} })} />
                <SelectFilterElement name={langDict[filters.sourceType.name]} defaultValue={filters.sourceType.defaultValue} values={filters.sourceType.values.map(value => { return {name: langDict[value.name], value: value.value} })} />
            </div>
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
        </div>
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