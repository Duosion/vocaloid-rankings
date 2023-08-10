import { getSong } from "@/data/songsData"
import { Locale, getDictionary } from "@/localization"
import { notFound } from "next/navigation"
import { Settings } from "../../settings"
import { cookies } from "next/dist/client/components/headers"
import { argbFromHex, themeFromSourceColor, hexFromArgb, redFromArgb, greenFromArgb, blueFromArgb, Scheme } from "@importantimport/material-color-utilities"
import Image from "next/image"
import { NumberFormatter, EntityName, DateFormatter } from "@/components/formatters"
import { SongTypeLocaleTokens } from "@/localization/DictionaryTokenMaps"
import Link from "next/link"

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

    // import language dictionary
    const langDict = await getDictionary(params.lang)

    // import general variables
    const songTotalViews = Number(song.views?.total) || 0

    // generate custom theme
    let customThemeLightCss: string = ''
    let customThemeDarkCss: string = ''
    {
        const theme = themeFromSourceColor(argbFromHex(song.averageColor))
        const schemes = theme.schemes
        customThemeLightCss = getCustomThemeStylesheet(schemes.light).join('')
        customThemeDarkCss = getCustomThemeStylesheet(schemes.dark).join('')
    }

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

            <div className="w-full h-96 overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant">
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
            <div className="font-extrabold text-5xl"> <EntityName names={song.names} preferred={settings.titleLanguage} /> </div>
            <div className="font-semibold text-3xl text-on-surface-variant"><NumberFormatter number={songTotalViews} /> {langDict.rankings_views} </div>

            <div className="mt-3 w-full grid grid-cols-sidebar gap-5">
            <div className="flex flex-col gap-5">
                    <div className="bg-surface-2 rounded-2xl p-5 box-border flex flex-col gap-5">
                        <StatRow title={langDict.filter_publish_date}>
                            <DateFormatter date={new Date(song.publishDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_order_by_addition}>
                            <DateFormatter date={new Date(song.additionDate)} />
                        </StatRow>
                        <StatRow title={langDict.filter_song_type} text={langDict[SongTypeLocaleTokens[song.type]]} />
                    </div>
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
                </div>
            </div>
        </div>
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
    return <Link className={`bg-surface-2 rounded-2xl p-2 box-border flex gap-2 relative before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:hover:opacity-[0.12] ${className}`} href={href}>
        {icon}
        <div className="text-lg text-on-surface w-full text-center flex items-center justify-center">{text}</div>
    </Link>
}

function SidebarIcon(
    {
        children,
        href,
        className,
        title
    }: {
        children: React.ReactNode
        href: string
        className?: string
        title?: string
    }
) {
    return <Link title={title} className={`bg-surface-2 rounded-2xl p-2 box-border flex gap-2 relative before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:hover:bg-on-primary before:hover:opacity-[0.12] ${className}`} href={href}>{children}</Link>
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
        return <div>
            <div className="text-lg text-on-surface font-semibold w-full">{title}</div>
            <div className="text-lg text-on-surface-variant w-full">{text}</div>
        </div>
    } else {
        return <div>
            <div className="text-lg text-on-surface font-semibold w-full">{title}</div>
            <div className="text-lg text-on-surface-variant w-full">{children}</div>
        </div>
    }
}