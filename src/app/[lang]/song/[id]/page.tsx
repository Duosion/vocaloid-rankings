import { ArtistCard } from "@/components/entity/artist-card"
import ArtistsGrid from "@/components/entity/artists-grid"
import { EntitySection } from "@/components/entity/entity-section"
import { DateFormatter } from "@/components/formatters/date-formatter"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import Image from '@/components/image'
import { Divider } from "@/components/material/divider"
import { getSong, getSongHistoricalViews, getSongMostRecentViews, getSongNames, insertSongViews, updateSong } from "@/data/songsData"
import { ArtistCategory, ArtistThumbnailType, Id, NameType, SourceType, UserAccessLevel } from "@/data/types"
import { getCustomThemeStylesheet } from "@/lib/material/material"
import { SourceTypesDisplayData } from "@/lib/sourceType"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { ArtistTypeLocaleTokens, NameTypeLocaleTokens, SongTypeLocaleTokens, SourceTypeLocaleTokens } from "@/localization/DictionaryTokenMaps"
import { Hct, SchemeVibrant, argbFromHex } from "@material/material-color-utilities"
import { Metadata } from "next"
import { cookies } from "next/dist/client/components/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { RefreshSongButton } from "./refresh-song-button"
import { DeleteSongButton } from "./delete-song-button copy"
import { getAuthenticatedUser } from "@/lib/auth"
import { SongViewsChart } from "./views-chart"

// interfaces
interface ViewsBreakdown {
    id: string,
    views: number,
    source: SourceType
}

export async function generateMetadata(
    {
        params
    }: {
        params: {
            id: string,
            lang: Locale
        }
    }
): Promise<Metadata> {
    // get settings
    const settings = new Settings(cookies())
    const settingTitleLanguage = settings.titleLanguage

    // get names
    const songId = Number(params.id)
    const names = isNaN(songId) ? null : await getSongNames(songId)

    return {
        title: names ? getEntityName(names, settingTitleLanguage) : null,
    }
}

export default async function SongPage(
    {
        params
    }: {
        params: {
            id: string
            lang: Locale
        }
    }
) {

    // convert the id parameter into a number; get song data
    const songId = Number(params.id)
    const song = !isNaN(songId) ? await getSong(songId) : null
    if (!song) return notFound()

    if (song.isDormant) {

        // update song views
        const views = await getSongMostRecentViews(song.id)
        if (views) {
            await insertSongViews(song.id, views)
        }

        // set song to not be dormant
        await updateSong({
            id: song.id,
            isDormant: false
        })
        song.isDormant = false
    }

    // get settings
    const requestCookies = cookies()
    const settings = new Settings(requestCookies)
    const authUser = await getAuthenticatedUser(requestCookies)

    // general variables
    const songTotalViews = Number(song.views?.total) || 0
    const settingTitleLanguage = settings.titleLanguage
    const songNames = song.names

    // song refreshing variables
    const songRefreshedToday = song.lastRefreshed && (24 * 60 * 60 * 1000) > (new Date().getTime() - new Date(song.lastRefreshed).getTime())

    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // generate name info
    const nameElements: JSX.Element[] = []
    {
        for (const item in NameType) {
            const nameType = Number(item) as NameType
            const name = isNaN(nameType) || nameType == NameType.ORIGINAL ? false : songNames[nameType]
            if (name) {
                nameElements.push(
                    <StatRow title={langDict[NameTypeLocaleTokens[nameType]]} text={name} />
                )
            }
        }
    }

    // generate artist elements
    const artistsMap = new Map(song.artists.map(artist => [artist.id, artist]))

    const generateArtistElements = (ids: Id[], category: ArtistCategory): JSX.Element[] => {
        const elements: JSX.Element[] = []
        const isSinger = category == ArtistCategory.VOCALIST
        for (const id of ids) {
            const artist = artistsMap.get(id)
            if (artist) {
                const artistNames = artist.names
                elements.push(<ArtistCard
                    src={artist.thumbnails[ArtistThumbnailType.SMALL]}
                    alt={getEntityName(artistNames, settingTitleLanguage)}
                    bgColor={artist.averageColor}
                    href={`/${lang}/artist/${artist.id}`}
                    title={<EntityName names={artistNames} preferred={settingTitleLanguage} />}
                    text={langDict[ArtistTypeLocaleTokens[artist.type]]}
                    isSinger={isSinger}
                />)
            }
        }
        return elements
    }

    const artistsCategories = song.artistsCategories
    const singers: JSX.Element[] = generateArtistElements(artistsCategories[ArtistCategory.VOCALIST], ArtistCategory.VOCALIST)
    const producers: JSX.Element[] = generateArtistElements(artistsCategories[ArtistCategory.PRODUCER], ArtistCategory.PRODUCER)

    const largestArtistColumnCount = Math.max(singers.length, producers.length)
    const artistColumnSize = largestArtistColumnCount >= 3 ? 'lg:grid-cols-3' : `lg:grid-cols-${largestArtistColumnCount}`

    // generate views breakdown
    const viewsBreakdowns: ViewsBreakdown[] = []
    const mostViewedSources: ViewsBreakdown[] = []
    {
        const songBreakdowns = song.views?.breakdown
        if (songBreakdowns) {
            // iterate each source type
            for (const item in SourceType) {
                const source = Number(item) as SourceType
                const breakdowns = isNaN(source) ? null : songBreakdowns[source]
                if (breakdowns) {
                    let largest: ViewsBreakdown | null = null
                    for (const breakdown of breakdowns) {
                        const views = breakdown.views
                        const videoId = breakdown.id
                        const formatted: ViewsBreakdown = {
                            id: videoId,
                            views: Number(views),
                            source: source
                        }
                        // update the largest
                        if (breakdown.views > (largest?.views || 0)) {
                            largest = formatted
                        }
                        viewsBreakdowns.push(formatted)
                    }
                    if (largest) {
                        mostViewedSources[source] = largest
                    }
                }
            }
        }
        viewsBreakdowns.sort((a: ViewsBreakdown, b: ViewsBreakdown) => {
            return b.views - a.views
        })
    }

    //generate video links
    const videoLinks: React.ReactNode[] = []
    mostViewedSources.map(info => {
        const source = info.source
        const displayData = SourceTypesDisplayData[source]
        const sourceLocalizedName = langDict[SourceTypeLocaleTokens[source]]
        videoLinks.push(
            <SidebarLink
                href={`${displayData.videoURL}${info.id}`}
                text={sourceLocalizedName}
                icon={
                    <Image
                        height={32}
                        width={32}
                        src={displayData.icon}
                        alt={sourceLocalizedName}
                        className="rounded-lg p-2 box-border"
                        style={{ backgroundColor: displayData.color }}
                    />
                }
            />
        )
    })

    // get historical views data
    const historicalViewsResult = (await getSongHistoricalViews(songId, 14))
    const largestHistoricalViews = Number(historicalViewsResult.largest)
    historicalViewsResult.views.reverse() // reverse the array to get the views in the order of (oldest date -> newest date) instead of the opposite.

    // generate custom theme
    let customThemeLightCss: string = ''
    let customThemeDarkCss: string = ''
    {
        const argbAverageColor = argbFromHex(song.averageColor)
        // dynamic theme config
        const contrast = 0.3
        customThemeLightCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), false, contrast)).join('')
        customThemeDarkCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), true, contrast)).join('')
    }

    // generate vocadb link
    const vocadbLink = (
        <SidebarLink
            href={`https://vocadb.net/S/${song.id}`}
            text='VocaDB'
            icon={
                <Image
                    height={32}
                    width={32}
                    src='/voca-db-icon.png'
                    alt='VocaDB'
                    className="bg-white rounded-lg p-2 box-border"
                />
            }
        />
    )

    return (
        <article className='max-w-screen-xl m-auto w-full min-h-[100vh] flex flex-col gap-5 justify-start items-start'>
            <style>{`
                :root {
                    ${customThemeLightCss}
                }
                [data-theme=dark] {
                    ${customThemeDarkCss}
                }
            `}</style>

            <figure className="w-full md:h-96 md:aspect-auto h-auto aspect-video overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant">
                <div className="w-full h-full z-0 bg-primary absolute top-0 left-0" />
                <Image
                    priority
                    fill
                    src={song.maxresThumbnail}
                    alt={getEntityName(songNames, settingTitleLanguage)}
                    className="z-10 object-cover text-3xl flex items-center justify-center font-extrabold text-on-primary-container"
                />
            </figure>

            <header className="flex flex-col gap-5 w-full">
                <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full"><EntityName names={songNames} preferred={settingTitleLanguage} /></h1>
                <h2 className="font-semibold md:text-3xl text-2xl text-on-background md:text-left text-center w-full"><NumberFormatter number={songTotalViews} /> {langDict.rankings_views} </h2>
            </header>

            <div className="mt-3 w-full grid md:grid-cols-sidebar grid-cols-1 gap-5">
                <aside className="flex flex-col gap-5">
                    <ul className="bg-surface-container rounded-2xl p-5 box-border flex md:flex-col flex-row gap-5 overflow-x-auto overflow-y-clip md:overflow-x-clip">
                        <StatRow title={langDict.filter_publish_date}>
                            <DateFormatter date={song.publishDate} />
                        </StatRow>
                        <StatRow title={langDict.filter_order_by_addition}>
                            <DateFormatter date={song.additionDate} />
                        </StatRow>
                        <StatRow title={langDict.filter_song_type} text={langDict[SongTypeLocaleTokens[song.type]]} />
                        {nameElements}
                    </ul>
                    <ul className="flex-col gap-5 md:flex hidden">
                        {authUser && authUser.accessLevel >= UserAccessLevel.MODERATOR ? <>
                            <DeleteSongButton
                                text={langDict.song_delete}
                                songId={songId}
                            />
                        </> : undefined}
                        {songRefreshedToday ? undefined : <>
                            <RefreshSongButton
                                text={langDict.song_refresh}
                                songId={songId}
                            />
                            <Divider />
                        </>}
                        {videoLinks}
                        {vocadbLink}
                    </ul>
                </aside>

                <div className="flex gap-5 flex-col">
                    <div className={`grid gap-5 grid-cols-1 lg:${largestArtistColumnCount == 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <EntitySection title={singers.length == 1 ? langDict.song_singers_singular : langDict.song_singers}>
                            <ArtistsGrid className={artistColumnSize}>{singers}</ArtistsGrid>
                        </EntitySection>
                        <EntitySection title={producers.length == 1 ? langDict.song_producers_singular : langDict.song_producers}>
                            <ArtistsGrid className={artistColumnSize}>{producers}</ArtistsGrid>
                        </EntitySection>
                    </div>
                    {/* Breakdown */}
                    <div className="grid gap-5 lg:grid-cols-2 grid-cols-1">
                        <EntitySection title={langDict.song_views_breakdown}>
                            <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-3 box-border">
                                <div className="h-28 flex sm:gap-5 gap-2 justify-start items-center overflow-x-auto overflow-y-clip max-w-full m-auto w-fit">
                                    {viewsBreakdowns.map(breakdown => {
                                        const displayData = SourceTypesDisplayData[breakdown.source]
                                        return <section key={breakdown.id} className="flex flex-col gap-2 items-center">
                                            <h4><Link href={`${displayData.videoURL}${breakdown.id}`} className="px-3 py-1 box-border text-base rounded-2xl w-fit" style={{ backgroundColor: displayData.color, color: displayData.textColor }}>
                                                {langDict[SourceTypeLocaleTokens[breakdown.source]]}
                                            </Link></h4>
                                            <span className="flex flex-row justify-center items-center sm:gap-2 gap-1 md:text-lg text-base whitespace-nowrap">
                                                <b className="font-normal" style={{ color: displayData.color }}><NumberFormatter number={breakdown.views as number} compact /></b>
                                                {langDict.rankings_views}
                                            </span>
                                        </section>
                                    })}
                                </div>
                                <div className="w-full rounded-full h-5 flex overflow-clip">
                                    {viewsBreakdowns.map(breakdown => {
                                        const displayData = SourceTypesDisplayData[breakdown.source]
                                        return <div key={breakdown.id} className="rounded-full h-full box-border" style={{ flex: breakdown.views / songTotalViews, backgroundColor: displayData.color }}></div>
                                    })}
                                </div>
                            </div>
                        </EntitySection>

                        {/* Daily Views */}
                        <EntitySection title={langDict.song_daily_views}>
                            <div className="bg-surface-container rounded-2xl p-5 flex justify-between md:gap-4 gap-1 overflow-x-auto overflow-y-clip">
                                <SongViewsChart
                                    historicalViewsResult={historicalViewsResult}
                                />
                                
                                {/* {historicalViewsResult.views.map(historicalViews => {
                                    const views = historicalViews.views as number
                                    return <section key={historicalViews.timestamp} className="flex flex-col h-[142px] justify-end items-center">
                                        <div className="bg-primary w-5 rounded-full" style={{ flex: views / largestHistoricalViews }}></div>
                                        <h4 className="text-on-surface font-semibold md:text-lg text-md mt-1"><NumberFormatter number={views} compact /></h4>
                                        <span className="text-on-surface-variant md:text-base text-sm"><DateFormatter date={new Date(historicalViews.timestamp)} compact /></span>
                                    </section>
                                })} */}
                            </div>
                        </EntitySection>
                    </div>

                    {mostViewedSources[SourceType.YOUTUBE] ? <div className="grid gap-5 lg:grid-cols-2 grid-cols-1">
                        <EntitySection title={langDict.song_video}>
                            <figure>
                                <iframe className="rounded-2xl w-full border border-outline-variant" id="youtube-player" title="YouTube video player"
                                    allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    src={`https://www.youtube-nocookie.com/embed/${mostViewedSources[SourceType.YOUTUBE].id}`} height="230" frameBorder="0"></iframe>
                            </figure>
                        </EntitySection>
                    </div> : null}

                    <div className="md:hidden flex flex-col gap-5">
                        <Divider />
                        {authUser && authUser.accessLevel >= UserAccessLevel.MODERATOR ? <>
                            <DeleteSongButton
                                text={langDict.song_delete}
                                songId={songId}
                            />
                        </> : undefined}
                        {songRefreshedToday ? undefined : <>
                            <RefreshSongButton
                                text={langDict.song_refresh}
                                songId={songId}
                            />
                            <Divider />
                        </>}
                        <EntitySection title={langDict.song_listen}>
                            <ul className="flex-col gap-5 flex">
                                {videoLinks}
                                {vocadbLink}
                            </ul>
                        </EntitySection>
                    </div>
                </div>
            </div>
        </article>
    )
}

function SidebarLink(
    {
        href,
        text,
        icon,
        className
    }: {
        href: string,
        text: string,
        icon?: React.ReactNode,
        className?: string
    }
) {
    return <li>
        <Link className={`bg-surface-container text-on-surface rounded-2xl p-2 box-border flex gap-2 relative before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:bg-primary before:opacity-0 hover:before:opacity-[0.03] hover:text-primary before:transition-opacity ${className}`} href={href}>
            {icon}
            <span className="text-lg text-inherit w-full text-center flex items-center justify-center transition-colors">{text}</span>
        </Link>
    </li>
}

function StatRow(
    {
        title,
        children,
        text
    }: {

        title: string
        children?: React.ReactNode
        text?: string
    }
) {
    return <li className="whitespace-nowrap">
        <h4 className="text-lg text-on-surface font-semibold w-full md:whitespace-break-spaces">{title}</h4>
        <span className="text-lg text-on-surface-variant w-full md:whitespace-break-spaces">{text || children}</span>
    </li>
}