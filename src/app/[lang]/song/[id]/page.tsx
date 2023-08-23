import { getSong, getSongHistoricalViews } from "@/data/songsData"
import { Locale, getDictionary, getEntityName } from "@/localization"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { cookies } from "next/dist/client/components/headers"
import { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb, Scheme, themeFromImage, SchemeContent, Hct, MaterialDynamicColors } from "@material/material-color-utilities"
import Image from "next/image"
import { NumberFormatter, EntityName, DateFormatter } from "@/components/formatters"
import { ArtistTypeLocaleTokens, NameTypeLocaleTokens, SongTypeLocaleTokens, SourceTypeLocaleTokens } from "@/localization/DictionaryTokenMaps"
import Link from "next/link"
import { ArtistCategory, ArtistThumbnailType, NameType, SourceType } from "@/data/types"

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

const tonalSurfaceContainers = {
    'surface-container-lowest': MaterialDynamicColors.surfaceContainerLowest,
    'surface-container-low': MaterialDynamicColors.surfaceContainerLow,
    'surface-container': MaterialDynamicColors.surfaceContainer,
    'surface-container-high': MaterialDynamicColors.surfaceContainerHigh,
    'surface-container-highest': MaterialDynamicColors.surfaceContainerHighest
}

// theme generation helper functions
const getRgbMdTokenFromArgb = (argb: number, suffix = '') => {
    return `--md-sys-color-${suffix}-rgb: ${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)};`
}
const getCustomThemeStylesheet = (
    theme: Scheme,
    dynamicScheme: SchemeContent
) => {

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

    // add tonal surface container values
    for (const key in tonalSurfaceContainers) {
        const dynamicColor = tonalSurfaceContainers[key as keyof typeof tonalSurfaceContainers]
        lines.push(`--md-sys-color-${key}: ${hexFromArgb(dynamicColor.getArgb(dynamicScheme))} !important;`)
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
    const songNames = song.names

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
    const singers: JSX.Element[] = []
    const producers: JSX.Element[] = []
    song.artists.forEach(artist => {
        const isSinger = artist.category == ArtistCategory.VOCALIST
        const artistNames = artist.names
        const element = <ArtistCard
            src={artist.thumbnails[ArtistThumbnailType.MEDIUM]}
            alt={getEntityName(artistNames, settingTitleLanguage)}
            bgColor={artist.averageColor}
            href={`/${lang}/artist/${artist.id}`}
            title={<EntityName names={artistNames} preferred={settingTitleLanguage} />}
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
        const argbAverageColor = argbFromHex(song.averageColor)
        const theme = themeFromSourceColor(argbAverageColor)
        const schemes = theme.schemes
        // dynamic theme config
        const contrast = 0.3
        customThemeLightCss = getCustomThemeStylesheet(schemes.light, new SchemeContent(Hct.fromInt(argbFromHex(song.lightColor)), false, contrast)).join('')
        customThemeDarkCss = getCustomThemeStylesheet(schemes.dark, new SchemeContent(Hct.fromInt(argbFromHex(song.darkColor)), true, contrast)).join('')
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

            <figure className="w-full md:h-96 md:aspect-auto h-auto aspect-video overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant">
                <div className="w-full h-full z-0" style={{ backgroundColor: song.averageColor }} />
                <Image
                    priority
                    fill
                    src={song.maxresThumbnail}
                    alt={getEntityName(songNames, settingTitleLanguage)}
                    style={{ objectFit: "cover" }}
                    className="z-1"
                />
            </figure>
            <h1 className="font-extrabold md:text-5xl md:text-left text-4xl text-center w-full"><EntityName names={songNames} preferred={settingTitleLanguage} /></h1>
            <h2 className="font-semibold md:text-3xl text-2xl text-on-background md:text-left text-center w-full"><NumberFormatter number={songTotalViews} /> {langDict.rankings_views} </h2>
            <div className="mt-3 w-full grid md:grid-cols-sidebar grid-cols-1 gap-5">
                <div className="flex flex-col gap-5">
                    <ul className="bg-surface-container-low rounded-2xl p-5 box-border flex md:flex-col flex-row gap-5 overflow-x-scroll overflow-y-clip md:overflow-x-clip">
                        <StatRow title={langDict.filter_publish_date}>
                            <DateFormatter date={new Date(song.publishDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_order_by_addition}>
                            <DateFormatter date={new Date(song.additionDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_song_type} text={langDict[SongTypeLocaleTokens[song.type]]} />
                        {nameElements}
                    </ul>
                    <ul className="flex-col gap-5 md:flex hidden">
                        {videoLinks}
                        {vocadbLink}
                    </ul>
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
                            <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3 box-border">
                                <div className="h-28 flex sm:gap-5 gap-2 justify-start items-center overflow-x-auto overflow-y-clip max-w-full m-auto w-fit">
                                    {viewsBreakdowns.map(breakdown => {
                                        const displayData = SourceTypesDisplayData[breakdown.source]
                                        return <div className="flex flex-col gap-2 items-center">
                                            <Link href={`${displayData.videoURL}${breakdown.id}`} className="px-3 py-1 box-border text-base rounded-2xl w-fit" style={{ backgroundColor: displayData.color, color: displayData.textColor }}>
                                                {langDict[SourceTypeLocaleTokens[breakdown.source]]}
                                            </Link>
                                            <span className="flex flex-row justify-center items-center sm:gap-2 gap-1 md:text-lg text-base whitespace-nowrap">
                                                <b className="font-normal" style={{ color: displayData.color }}><NumberFormatter number={breakdown.views as number} compact /></b>
                                                {langDict.rankings_views}
                                            </span>
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
                            <div className="bg-surface-container-low rounded-2xl p-5 flex justify-between md:gap-4 gap-1 overflow-x-scroll overflow-y-clip">
                                {historicalViewsResult.views.map(historicalViews => {
                                    const views = historicalViews.views as number
                                    return <section className="flex flex-col h-[142px] justify-end items-center">
                                        <div className="bg-primary w-5 rounded-full" style={{ flex: views / largestHistoricalViews }}></div>
                                        <h4 className="text-on-surface font-semibold md:text-lg text-md mt-1"><NumberFormatter number={views} compact /></h4>
                                        <span className="text-on-surface md:text-base text-sm"><DateFormatter date={new Date(historicalViews.timestamp)} compact /></span>
                                    </section>
                                })}
                            </div>
                        </Section>
                    </div>
                    <figure className="grid gap-5 lg:grid-cols-2 grid-cols-1">
                        {mostViewedSources[SourceType.YOUTUBE] ? <Section title={langDict.song_video}>
                            <iframe className="rounded-2xl w-full border border-outline-variant" id="youtube-player" title="YouTube video player"
                                allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                                src={`https://www.youtube-nocookie.com/embed/${mostViewedSources[SourceType.YOUTUBE].id}`} height="230" frameBorder="0"></iframe>
                        </Section> : null}
                    </figure>
                    <div className="md:hidden">
                        <Section title={langDict.song_listen}>
                            <ul className="flex-col gap-5 flex">
                                {videoLinks}
                                {vocadbLink}
                            </ul>
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
    return <section>
        <h3 className='text-xl font-bold mb-2'>{title}</h3>
        {children}
    </section>
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
    return <Link className={`bg-surface-container-low text-on-surface rounded-2xl p-2 box-border flex gap-2 relative before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:opacity-0 hover:before:opacity-[0.12] hover:text-primary before:transition-opacity ${className}`} href={href}>
        {icon}
        <span className="text-lg text-inherit w-full text-center flex items-center justify-center transition-colors">{text}</span>
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
    return <li className="whitespace-nowrap">
        <h4 className="text-lg text-on-surface font-semibold w-full md:whitespace-break-spaces">{title}</h4>
        <span className="text-lg text-on-surface-variant w-full md:whitespace-break-spaces">{text || children}</span>
    </li>
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
        <Link className={`bg-surface-container-low text-on-surface rounded-2xl relative flex gap-3 items-center overflow-clip before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:opacity-0 hover:before:opacity-[0.12] hover:text-primary before:transition-opacity ${className}`} href={href}>
            <figure className="relative overflow-clip h-14 w-14 flex justify-start items-center m-2 rounded-2xl border border-outline-variant" style={{ backgroundColor: bgColor }}>
                <Image
                    fill
                    src={src}
                    alt={alt}
                    style={{ objectFit: "cover", objectPosition: isSinger ? 'top' : 'center' }}
                />
            </figure>
            <section className="flex flex-col py-1 overflow-hidden">
                <h4 className="text-xl font-semibold w-full whitespace-nowrap overflow-clip text-ellipsis text-inherit transition-colors">{title}</h4>
                <span className="text-md text-on-surface-variant w-full">{text}</span>
            </section>
        </Link>
    )
}