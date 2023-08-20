import { getSong, getSongHistoricalViews } from "@/data/songsData"
import { Locale, getDictionary } from "@/localization"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { cookies } from "next/dist/client/components/headers"
import { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb, Scheme } from "@importantimport/material-color-utilities"
import Image from "next/image"
import { NumberFormatter, EntityName, DateFormatter } from "@/components/formatters"
import { ArtistTypeLocaleTokens, NameTypeLocaleTokens, SongTypeLocaleTokens, SourceTypeLocaleTokens } from "@/localization/DictionaryTokenMaps"
import Link from "next/link"
import { ArtistCategory, ArtistThumbnailType, NameType, SourceType, VideoViews } from "@/data/types"

// interfaces
interface ViewsBreakdown {
    id: string,
    views: number,
    source: SourceType
}

// source type display data
export interface SourceTypeDisplayData {
    color: string,
    textColor: string,
    videoURL: string,
    icon: string
}
export const SourceTypesDisplayData: { [key in SourceType]: SourceTypeDisplayData } = {
    [SourceType.YOUTUBE]: {
        color: '#ff0000',
        textColor: '#ffffff',
        videoURL: 'https://www.youtube.com/watch?v=',
        icon: '/yt_icon.png'
    },
    [SourceType.NICONICO]: {
        color: 'var(--md-sys-color-on-surface)',
        textColor: 'var(--md-sys-color-surface)',
        videoURL: 'https://www.nicovideo.jp/watch/',
        icon: '/nico_icon.png'
    },
    [SourceType.BILIBILI]: {
        color: '#079fd2',
        textColor: '#ffffff',
        videoURL: 'https://www.bilibili.com/video/',
        icon: '/bili_icon.png'
    },
}

// theme generation helper functions
const getRgbMdTokenFromArgb = (argb: number, suffix = '') => {
    return `--md-sys-color-${suffix}-rgb: ${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)};`
}
const getCustomThemeStylesheet = (theme: Scheme) => {

    const lines = []

    for (const [key, argb] of Object.entries(theme.toJSON())) {
        if (key != 'background') {
            const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            const color = hexFromArgb(argb);
            lines.push(`--md-sys-color-${token}: ${color} !important;`)
        }
    }

    // add primary rgb values
    const primary = theme['primary']
    if (primary) {
        lines.push(getRgbMdTokenFromArgb(primary, "primary"))
    }
    // add bg rgb values
    const background = theme['background']
    if (background) {
        lines.push(getRgbMdTokenFromArgb(background, "background"))
    }

    return lines
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
    if (!song) { notFound() }

    // get settings
    const settings = new Settings(cookies())

    // general variables
    const songTotalViews = Number(song.views?.total) || 0
    const settingTitleLanguage = settings.titleLanguage

    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // generate name info
    const nameElements: JSX.Element[] = []
    {
        const songNames = song.names
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
    const singers: JSX.Element[] = []
    const producers: JSX.Element[] = []
    song.artists.forEach(artist => {
        const isSinger = artist.category == ArtistCategory.VOCALIST
        const element = <ArtistCard
            src={artist.thumbnails[ArtistThumbnailType.MEDIUM]}
            alt={'TODO'} // TODO
            bgColor={artist.averageColor}
            href={`/${lang}/artist/${artist.id}`}
            title={<EntityName names={artist.names} preferred={settingTitleLanguage} />}
            text={langDict[ArtistTypeLocaleTokens[artist.type]]}
            isSinger={isSinger}
        />
        if (isSinger) {
            singers.push(element)
        } else {
            producers.push(element)
        }
    })
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
    const historicalViewsResult = (await getSongHistoricalViews(songId))
    const largestHistoricalViews = Number(historicalViewsResult.largest)
    historicalViewsResult.views.reverse() // reverse the array to get the views in the order of (oldest date -> newest date) instead of the opposite.

    // generate custom theme
    let customThemeLightCss: string = ''
    let customThemeDarkCss: string = ''
    {
        const theme = themeFromSourceColor(argbFromHex(song.averageColor))
        const schemes = theme.schemes
        customThemeLightCss = getCustomThemeStylesheet(schemes.light).join('')
        customThemeDarkCss = getCustomThemeStylesheet(schemes.dark).join('')
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
        <div className='w-full min-h-[100vh] flex flex-col gap-5 justify-start items-start'>
            <style>{`
                :root {
                    ${customThemeLightCss}
                }
                [data-theme=dark] {
                    ${customThemeDarkCss}
                }
            `}</style>

            <div className="w-full md:h-96 md:aspect-auto h-auto aspect-video overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant">
                <div className="w-full h-full z-0" style={{ backgroundColor: song.averageColor }} />
                <Image
                    priority
                    fill
                    src={song.maxresThumbnail}
                    alt={'TODO'} // TODO
                    style={{ objectFit: "cover" }}
                    className="z-1"
                />
            </div>
            <div className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full"> <EntityName names={song.names} preferred={settingTitleLanguage} /> </div>
            <div className="font-semibold md:text-3xl text-2xl text-on-background md:text-left text-center w-full"><NumberFormatter number={songTotalViews} /> {langDict.rankings_views} </div>

            <div className="mt-3 w-full grid md:grid-cols-sidebar grid-cols-1 gap-5">
                <div className="flex flex-col gap-5">
                    <div className="bg-surface-2 rounded-2xl p-5 box-border flex md:flex-col flex-row gap-5 overflow-x-scroll overflow-y-clip md:overflow-x-clip">
                        <StatRow title={langDict.filter_publish_date}>
                            <DateFormatter date={new Date(song.publishDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_order_by_addition}>
                            <DateFormatter date={new Date(song.additionDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_song_type} text={langDict[SongTypeLocaleTokens[song.type]]} />
                        {nameElements}
                    </div>
                    <div className="flex-col gap-5 md:flex hidden">
                        {videoLinks}
                        {vocadbLink}
                    </div>
                </div>
                <div className="flex gap-5 flex-col">
                    <div className={`grid gap-5 grid-cols-1 lg:${largestArtistColumnCount == 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <Section title={singers.length == 1 ? langDict.song_singers_singular : langDict.song_singers}>
                            <div className={`grid gap-5 grid-cols-1 ${artistColumnSize}`}>
                                {singers}
                            </div>
                        </Section>
                        <Section title={producers.length == 1 ? langDict.song_producers_singular : langDict.song_producers}>
                            <div className={`grid gap-5 grid-cols-1 ${artistColumnSize}`}>
                                {producers}
                            </div>
                        </Section>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2 grid-cols-1">
                        <Section title={langDict.song_views_breakdown}>
                            <div className="bg-surface-2 rounded-2xl p-5 flex flex-col gap-3 box-border">
                                <div className="h-28 flex sm:gap-5 gap-2 justify-start items-center overflow-x-auto overflow-y-clip max-w-full m-auto w-fit">
                                    {viewsBreakdowns.map(breakdown => {
                                        const displayData = SourceTypesDisplayData[breakdown.source]
                                        return <div className="flex flex-col gap-2 items-center">
                                            <Link href={`${displayData.videoURL}${breakdown.id}`} className="px-3 py-1 box-border text-base rounded-2xl w-fit" style={{ backgroundColor: displayData.color, color: displayData.textColor }}>
                                                {langDict[SourceTypeLocaleTokens[breakdown.source]]}
                                            </Link>
                                            <div className="flex flex-row justify-center items-center sm:gap-2 gap-1 md:text-lg text-base whitespace-nowrap">
                                                <div style={{ color: displayData.color }}><NumberFormatter number={breakdown.views as number} compact /></div>
                                                {langDict.rankings_views}
                                            </div>
                                        </div>
                                    })}
                                </div>
                                <div className="w-full rounded-full h-5 flex overflow-clip">
                                    {viewsBreakdowns.map(breakdown => {
                                        const displayData = SourceTypesDisplayData[breakdown.source]
                                        return <div className="rounded-full h-full box-border" style={{ flex: breakdown.views / songTotalViews, backgroundColor: displayData.color }}></div>
                                    })}
                                </div>
                            </div>
                        </Section>
                        <Section title={langDict.song_daily_views}>
                            <div className="bg-surface-2 rounded-2xl p-5 flex justify-between md:gap-4 gap-1 overflow-x-scroll overflow-y-clip">
                                {historicalViewsResult.views.map(historicalViews => {
                                    const views = historicalViews.views as number
                                    return <div className="flex flex-col h-[142px] justify-end items-center">
                                        <div className="bg-primary w-5 rounded-full" style={{ flex: views / largestHistoricalViews }}></div>
                                        <div className="text-on-surface font-semibold md:text-lg text-md mt-1"><NumberFormatter number={views} compact /></div>
                                        <div className="text-on-surface md:text-base text-sm"><DateFormatter date={new Date(historicalViews.timestamp)} compact /></div>
                                    </div>
                                })}
                            </div>
                        </Section>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2 grid-cols-1">
                        {mostViewedSources[SourceType.YOUTUBE] ? <Section title={langDict.song_video}>
                            <iframe className="rounded-2xl w-full border border-outline-variant" id="youtube-player" title="YouTube video player"
                                allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                                src={`https://www.youtube-nocookie.com/embed/${mostViewedSources[SourceType.YOUTUBE].id}`} height="230" frameBorder="0"></iframe>
                        </Section> : null}
                    </div>
                    <div className="md:hidden">
                        <Section title={langDict.song_listen}>
                            <div className="flex-col gap-5 flex">
                                {videoLinks}
                                {vocadbLink}
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Section(
    {
        children,
        title
    }: {
        children: React.ReactNode,
        title: string,
        className?: string
    }
) {
    return <div>
        <div className='text-xl font-bold mb-2'>{title}</div>
        {children}
    </div>
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
    return <Link className={`bg-surface-2 text-on-surface rounded-2xl p-2 box-border flex gap-2 relative before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:opacity-0 hover:before:opacity-[0.12] hover:text-primary before:transition-opacity ${className}`} href={href}>
        {icon}
        <div className="text-lg text-inherit w-full text-center flex items-center justify-center transition-colors">{text}</div>
    </Link>
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
    if (text) {
        return <div className="whitespace-nowrap">
            <div className="text-lg text-on-surface font-semibold w-full md:whitespace-break-spaces">{title}</div>
            <div className="text-lg text-on-surface-variant w-full md:whitespace-break-spaces">{text}</div>
        </div>
    } else {
        return <div className="whitespace-nowrap">
            <div className="text-lg text-on-surface font-semibold w-full md:whitespace-break-spaces">{title}</div>
            <div className="text-lg text-on-surface-variant w-full md:whitespace-break-spaces">{children}</div>
        </div>
    }
}

function ArtistCard(
    {
        src,
        alt,
        bgColor,
        href,
        title,
        text,
        isSinger = false,
        className
    }: {
        src: string
        alt: string
        bgColor: string
        href: string
        title: React.ReactNode
        text: string
        isSinger?: boolean
        className?: string
    }
) {
    return (
        <Link className={`bg-surface-2 text-on-surface rounded-2xl relative flex gap-3 items-center overflow-clip before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:opacity-0 hover:before:opacity-[0.12] hover:text-primary before:transition-opacity ${className}`} href={href}>
            <div className="relative overflow-clip h-14 w-14 flex justify-start items-center m-2 rounded-2xl border border-outline-variant" style={{ backgroundColor: bgColor }}>
                <Image
                    fill
                    src={src}
                    alt={alt}
                    style={{ objectFit: "cover", objectPosition: isSinger ? 'top' : 'center' }}
                />
            </div>
            <div className="flex flex-col py-1 overflow-hidden">
                <div className="text-lg font-semibold w-full whitespace-nowrap overflow-clip text-ellipsis text-inherit transition-colors">{title}</div>
                <div className="text-md text-on-surface-variant w-full">{text}</div>
            </div>
        </Link>
    )
}