import { EntityName, NumberFormatter } from "@/components/formatters"
import { filterRankings } from "@/data/songsData"
import { ArtistCategory, RankingsFilterParams } from "@/data/types"
import { Locale, getDictionary } from "@/localization"
import { Settings } from "../settings"
import Link from "next/link"
import { cookies } from "next/dist/client/components/headers"
import SongThumbnail from "@/components/song_thumbnail"

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
            {rankings.results.map(ranking => {
                const song = ranking.song
                
                // generate artist links
                const artistLinks: React.ReactNode[] = []
                for (const artist of song.artists) {
                    if (artist.category == ArtistCategory.PRODUCER) {
                        artistLinks.push(
                            <Link href={`/${lang}/artist/${song.id}`} className="text-md text-on-surface-variant"><EntityName names={artist.names} preferred={settingTitleLanguage}/></Link>
                        )
                    }
                }

                return (
                    <Ranking
                        href={`/${lang}/song/${song.id}`}
                        titleContent={<EntityName names={song.names} preferred={settingTitleLanguage}/>}
                        placement={ranking.placement}
                        icon={song.thumbnail}
                        trailingTitleContent={<NumberFormatter number={ranking.views}/>}
                        trailingSupporting={langDict.rankings_views}
                        supportingContent={<div className="flex flex-row gap-5">{artistLinks}</div>}
                    />
                )
            })}
        </div>
    )
}

export function Ranking (
    {
        href,
        titleContent,
        placement,
        icon,
        trailingTitleContent,
        supportingContent,
        trailingSupporting,
        className
    }: {
        href: string
        titleContent: React.ReactNode
        placement: number
        icon: string
        trailingTitleContent: React.ReactNode,
        supportingContent?: React.ReactNode
        trailingSupporting?: string,
        className?: string
    }
) {
    return (
        <div className={`py-2 rounded-2xl w-full flex gap-3 bg-surface-2 box-border items-center ${className}`}>
            <div className="ml-3 text-on-surface h-10 w-fit min-w-[40px] box-border flex items-center justify-center text-2xl font-extrabold">{placement}</div>
            <Link href={href} className="rounded-xl border border-outline-variant box-border"><SongThumbnail src={icon} alt={'TODO'} width={50} height={50} overflowHeight={70} overflowWidth={70}/></Link>
            <div className="flex flex-col gap flex-1">
                <Link href={href} className="text-on-surface font-semibold text-xl">{titleContent}</Link>
                {supportingContent}
            </div>
            <div className="flex flex-col gap items-end mr-4">
                <div className="text-on-surface text-xl font-bold">{trailingTitleContent}</div>
                <div className="text-on-surface-variant text-md">{trailingSupporting}</div>
            </div>
        </div>
    )
}