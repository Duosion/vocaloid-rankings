import { ArtistCard } from "@/components/entity/artist-card"
import { EntitySection } from "@/components/entity/entity-section"
import { DateFormatter } from "@/components/formatters/date-formatter"
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import Image from '@/components/image'
import { Divider } from "@/components/material/divider"
import { filterSongRankings, getArtist, getArtistHistoricalViews } from "@/data/songsData"
import { ArtistCategory, ArtistThumbnailType, FilterOrder, NameType, SongRankingsFilterParams, SourceType } from "@/data/types"
import { getCustomThemeStylesheet } from "@/lib/material/material"
import { SourceTypesDisplayData } from "@/lib/sourceType"
import { mapArtistTypeToCategory } from "@/lib/utils"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { ArtistTypeLocaleTokens, NameTypeLocaleTokens, SourceTypeLocaleTokens } from "@/localization/DictionaryTokenMaps"
import { Hct, SchemeVibrant, argbFromHex } from "@material/material-color-utilities"
import { cookies } from "next/dist/client/components/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { CoArtists } from "./co-artists"
import { RelatedArtists } from "./related-artists"
import { TopSongs } from "./top-songs"
import { ArtistSongs } from "./artist-songs"

// interfaces
interface ViewsBreakdown {
    id: string,
    views: number,
    source: SourceType
}

export default async function ArtistPage(
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
    const artistId = Number(params.id)
    const artist = !isNaN(artistId) ? await getArtist(artistId, true, true) : null
    if (!artist) { notFound() }

    // get the artist's top songs
    const artistTopSongsRankingsFilterParams = new SongRankingsFilterParams()
    artistTopSongsRankingsFilterParams.includeArtists = [artistId]
    artistTopSongsRankingsFilterParams.maxEntries = 6
    const artistTopSongsRankingsFilterResults = await filterSongRankings(artistTopSongsRankingsFilterParams)
    const artistTopSongsRankingsResultsCount = artistTopSongsRankingsFilterResults.totalCount

    // get the artist's most recent songs
    artistTopSongsRankingsFilterParams.orderBy = FilterOrder.PUBLISH_DATE
    // if the amount of results from the previous filter is > 12, get the artist's most recent songs
    const artistRecentSongsRankingsFilterResults = artistTopSongsRankingsResultsCount >= artistTopSongsRankingsFilterParams.maxEntries * 2 ? await filterSongRankings(artistTopSongsRankingsFilterParams) : undefined

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const artistTotalViews = Number(artist.views?.total) || 0
    const settingTitleLanguage = settings.titleLanguage
    const artistNames = artist.names

    const artistType = artist.type
    const artistCategory = mapArtistTypeToCategory(artistType)

    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // generate name info
    const nameElements: JSX.Element[] = []
    {
        for (const item in NameType) {
            const nameType = Number(item) as NameType
            const name = isNaN(nameType) || nameType == NameType.ORIGINAL ? false : artistNames[nameType]
            if (name) {
                nameElements.push(
                    <StatRow title={langDict[NameTypeLocaleTokens[nameType]]} text={name} />
                )
            }
        }
    }

    // generate views breakdown
    const viewsBreakdowns: ViewsBreakdown[] = []
    {
        const songBreakdowns = artist.views?.breakdown
        if (songBreakdowns) {
            // iterate each source type
            for (const item in SourceType) {
                const source = Number(item) as SourceType
                const breakdowns = isNaN(source) ? null : songBreakdowns[source]
                if (breakdowns) {
                    for (const breakdown of breakdowns) {
                        const views = breakdown.views
                        const videoId = breakdown.id
                        const formatted: ViewsBreakdown = {
                            id: videoId,
                            views: Number(views),
                            source: source
                        }
                        viewsBreakdowns.push(formatted)
                    }
                }
            }
        }
        viewsBreakdowns.sort((a: ViewsBreakdown, b: ViewsBreakdown) => {
            return b.views - a.views
        })
    }

    // get historical views data
    const historicalViewsResult = (await getArtistHistoricalViews(artistId))
    const largestHistoricalViews = Number(historicalViewsResult.largest)
    historicalViewsResult.views.reverse() // reverse the array to get the views in the order of (oldest date -> newest date) instead of the opposite.

    // generate custom theme
    let customThemeLightCss: string = ''
    let customThemeDarkCss: string = ''
    {
        const argbAverageColor = argbFromHex(artist.averageColor)
        // dynamic theme config
        const contrast = 0.3
        customThemeLightCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), false, contrast)).join('')
        customThemeDarkCss = getCustomThemeStylesheet(new SchemeVibrant(Hct.fromInt(argbAverageColor), true, contrast)).join('')
    }

    // generate vocadb link
    const vocadbLink = (
        <SidebarLink
            href={`https://vocadb.net/Ar/${artist.id}`}
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

    // get base artist
    const baseArtist = artist.baseArtist

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
                <div
                    className="w-full h-full z-0 absolute top-0 left-0 flex items-center justify-center"
                    style={{
                        background: 'radial-gradient(var(--md-sys-color-primary) 1px, var(--md-sys-color-primary-container) 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                <Image
                    priority
                    src={artist.thumbnails[ArtistThumbnailType.MEDIUM] || artist.thumbnails[ArtistThumbnailType.ORIGINAL]}
                    alt={getEntityName(artistNames, settingTitleLanguage)}
                    className={`z-10 object-contain h-full p-3 rounded-3xl text-3xl flex items-center justify-center font-extrabold text-on-primary-container filter${artistCategory == ArtistCategory.VOCALIST ? ' drop-shadow-image' : ''}`}
                />
            </figure>

            <header className="flex flex-col gap-5 w-full">
                <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full"><EntityName names={artistNames} preferred={settingTitleLanguage} /></h1>
                <h2 className="font-semibold md:text-3xl text-2xl text-on-background md:text-left text-center w-full"><NumberFormatter number={artistTotalViews} /> {langDict.rankings_views} </h2>
            </header>

            <div className="mt-3 w-full grid md:grid-cols-sidebar grid-cols-1 gap-5">
                <aside className="flex flex-col gap-5">
                    <ul className="bg-surface-container rounded-2xl p-5 box-border flex md:flex-col flex-row gap-5 overflow-x-auto overflow-y-clip md:overflow-x-clip">
                        <StatRow title={langDict.filter_publish_date}>
                            <DateFormatter date={new Date(artist.publishDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_order_by_addition}>
                            <DateFormatter date={new Date(artist.additionDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_artist_type} text={langDict[ArtistTypeLocaleTokens[artistType]]} />
                        <StatRow title={langDict.artist_featured_in}>
                            <NumberFormatter number={artistTopSongsRankingsResultsCount}/>{langDict.rankings_song_count}
                        </StatRow>
                        {nameElements}
                    </ul>
                    <ul className="flex-col gap-5 md:flex hidden">
                        {vocadbLink}
                    </ul>
                </aside>
                <div className="flex gap-6 flex-col">
                    {/* Top Songs */}
                    <ArtistSongs
                        title={langDict.artist_top_songs}
                        titleLanguage={settingTitleLanguage}
                        langDict={langDict}
                        songRankingsResult={artistTopSongsRankingsFilterResults}
                        columnsClassName='xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-3 grid-cols-2'
                        href={artistTopSongsRankingsResultsCount > artistTopSongsRankingsFilterParams.maxEntries ? `../rankings?includeArtists=${artistId}` : undefined}
                    />

                    <Divider />

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
                                        return <div key={breakdown.id} className="rounded-full h-full box-border" style={{ flex: breakdown.views / artistTotalViews, backgroundColor: displayData.color }}></div>
                                    })}
                                </div>
                            </div>
                        </EntitySection>

                        {/* Daily Views */}
                        <EntitySection title={langDict.song_daily_views}>
                            <div className="bg-surface-container rounded-2xl p-5 flex justify-between md:gap-4 gap-1 overflow-x-auto overflow-y-clip">
                                {historicalViewsResult.views.map(historicalViews => {
                                    const views = historicalViews.views as number
                                    return <section key={historicalViews.timestamp} className="flex flex-col h-[142px] justify-end items-center">
                                        <div className="bg-primary w-5 rounded-full" style={{ flex: views / largestHistoricalViews }}></div>
                                        <h4 className="text-on-surface font-semibold md:text-lg text-md mt-1"><NumberFormatter number={views} compact /></h4>
                                        <span className="text-on-surface-variant md:text-base text-sm"><DateFormatter date={new Date(historicalViews.timestamp)} compact /></span>
                                    </section>
                                })}
                            </div>
                        </EntitySection>
                    </div>

                    {/* co artists */}
                    <CoArtists artistId={artistId} category={artistCategory} langDict={langDict} maxEntries={4} />

                    {/* Related Artists */}
                    <RelatedArtists artistId={artistId} langDict={langDict} maxEntries={10}>
                        {baseArtist ? <ArtistCard
                            src={baseArtist.thumbnails[ArtistThumbnailType.SMALL] || baseArtist.thumbnails[ArtistThumbnailType.ORIGINAL]}
                            alt={getEntityName(baseArtist.names, settingTitleLanguage)}
                            bgColor={baseArtist.averageColor}
                            href={`/${lang}/artist/${baseArtist.id}`}
                            title={<EntityName names={baseArtist.names} preferred={settingTitleLanguage} />}
                            text={langDict['artist_related_artist_parent']}
                            isSinger={true}
                        /> : undefined}
                    </RelatedArtists>

                    <Divider/>

                    {/* Most Recent Songs */}
                    {artistRecentSongsRankingsFilterResults ? <ArtistSongs
                        minimal
                        title={langDict.artist_top_songs}
                        titleLanguage={settingTitleLanguage}
                        langDict={langDict}
                        songRankingsResult={artistRecentSongsRankingsFilterResults}
                        columnsClassName='xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-3 grid-cols-2'
                        href={artistTopSongsRankingsResultsCount > artistTopSongsRankingsFilterParams.maxEntries ? `../rankings?includeArtists=${artistId}&orderBy=${FilterOrder.PUBLISH_DATE}` : undefined}
                    /> : undefined}
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