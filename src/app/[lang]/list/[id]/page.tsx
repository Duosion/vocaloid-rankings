import { getList, getMostRecentViewsTimestamp } from "@/data/songsData"
import { Locale, getDictionary } from "@/localization"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { cookies } from "next/headers"
import { generateTimestamp } from "@/lib/utils"
import { RankingsList } from "../../rankings/rankings-list"
import { songRankingsFilters } from "../../rankings/page"
import { SongRankingsFiltersValues } from "../../rankings/types"
import { Divider } from "@/components/material/divider"
import Image from "@/components/image"

export default async function ListPage(
    {
        params,
        searchParams
    }: {
        params: {
            id: string,
            lang: Locale
        },
        searchParams: SongRankingsFiltersValues
    }
) {

    // CHANGE COLOR BASED ON IMAGE AVERAGE COLOR?

    // convert the id parameter into a number; get song data
    const listId = Number(params.id)
    const list = !isNaN(listId) ? await getList(listId) : null
    if (!list) return notFound()

    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const viewMode = settings.rankingsViewMode

    const mostRecentTimestamp = (await getMostRecentViewsTimestamp()) || generateTimestamp()

    // set the list
    searchParams.list = listId

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen">
            <section className="flex gap-5">
                <figure>
                    <Image src={list.image || ''} className='aspect-square h-full w-48 rounded-3xl object-cover' alt={list.names[lang] || ''} />
                </figure>
                <div className="flex flex-col gap-3 justify-end mb-3">
                    <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full">{list.names[lang]}</h1>
                    <h3 className="font-semibold text-primary md:text-left text-xl text-center w-full">{langDict.list_song_count.replace(':count', list.songIds.length.toString())}</h3>
                    <p className="text-on-surface-variant text-xl text-left w-full whitespace-break-spaces">{list.descriptions[lang]}</p>
                </div>
            </section>
            <Divider />
            <RankingsList
                href=''
                filters={songRankingsFilters}
                filterValues={searchParams}
                currentTimestamp={mostRecentTimestamp}
                viewMode={viewMode}
            />
        </section>
    )

}