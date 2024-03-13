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
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { IconButton } from "@/components/material/icon-button"
import { getCustomThemeStylesheet, getImageMostVibrantColor } from "@/lib/material/material"
import { Hct, SchemeVibrant, argbFromHex, argbFromRgb } from "@material/material-color-utilities"

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

    // convert the id parameter into a number; get song data
    const listId = Number(params.id)
    const list = !isNaN(listId) ? await getList(listId) : null
    if (!list) return notFound()

    // CHANGE COLOR BASED ON IMAGE AVERAGE COLOR?
    const vibrantColor = list.image ? await getImageMostVibrantColor(list.image) : null

    // generate custom theme
    let customThemeLightCss: string = ''
    let customThemeDarkCss: string = ''
    if (vibrantColor) {
        const argbAverageColor = argbFromRgb(vibrantColor[0], vibrantColor[1], vibrantColor[2])
        // dynamic theme config
        const contrast = 0.3
        customThemeLightCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), false, contrast)).join('')
        customThemeDarkCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), true, contrast)).join('')
    }

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
            <style>{`
                :root {
                    ${customThemeLightCss}
                }
                [data-theme=dark] {
                    ${customThemeDarkCss}
                }
            `}</style>
            
            <section className="flex gap-5 flex-col md:flex-row">
                <figure>
                    <Image src={list.image || ''} className='h-48 w-48 mx-auto rounded-3xl object-cover' alt={list.names[lang] || ''} />
                </figure>
                <section className="flex flex-1 flex-col gap-3 justify-end mb-3">
                    <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full">{list.names[lang]}</h1>
                    <h3 className="font-semibold text-primary md:text-left text-xl text-center w-full">{langDict.list_song_count.replace(':count', list.songIds.length.toString())}</h3>
                    <p className="text-on-surface-variant md:text-left text-center text-xl w-full whitespace-break-spaces">{list.descriptions[lang]}</p>
                </section>
                <section className="flex gap-3 items-end justify-center md:justify-end">
                    <IconButton
                        icon="delete"
                    />
                    <FilledButton
                        text={langDict.list_edit}
                        icon="edit"
                    />
                </section>
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