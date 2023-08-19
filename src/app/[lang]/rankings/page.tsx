import { EntityName, NumberFormatter } from "@/components/formatters"
import { filterRankings } from "@/data/songsData"
import { RankingsFilterParams } from "@/data/types"
import { Locale, getDictionary } from "@/localization"
import { Settings } from "../settings"
import Link from "next/link"
import { cookies } from "next/dist/client/components/headers"

export default async function SongPage(
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
        <div className="flex flex-col gap-5">
            {rankings.results.map(ranking => {
                return (
                    <div className="w-full h-7 flex gap-5">
                        <div className="text-lg text-on-background">{ranking.placement}</div>
                        <Link className="text-lg text-on-background" href={`/${lang}/song/${ranking.song.id}`}><EntityName names={ranking.song.names} preferred={settingTitleLanguage}/></Link>
                        <div className="text-lg text-on-background"><NumberFormatter number={ranking.views}/></div>
                    </div>
                )
            })}
        </div>
    )

}
