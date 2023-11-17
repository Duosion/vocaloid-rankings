import Link from "next/link"
import { ImageDisplayMode } from '..'
import EntityThumbnail from '../entity-thumbnail'
import { CSSProperties } from "react"

export function RankingsGridItem(
    {
        key,
        href,
        titleContent,
        icon,
        iconAlt,
        placement,
        trailingTitleContent,
        imageDisplayMode = ImageDisplayMode.SONG,
        trailingSupporting,
        className = '',
        color,
        style
    }: {
        key: string
        href: string
        titleContent: React.ReactNode
        icon: string
        iconAlt: string
        placement?: number
        trailingTitleContent?: React.ReactNode
        imageDisplayMode?: ImageDisplayMode
        trailingSupporting?: string
        in?: boolean
        className?: string
        color?: string
        timeout?: number
        style?: CSSProperties
    }
) {
    return (
        <article key={key} className={`w-full flex flex-col gap-3 relative box-border items-center transition-all ${className}`} style={{
            color: color,
            ...style
        }}>
            {placement == undefined ? undefined : <div className="text-xl bg-inverse-surface text-inverse-on-surface rounded-xl absolute -left-5 -top-4 p-2 z-[5] font-black border border-outline-variant box-border">#{placement}</div>}
            <Link href={href} className="aspect-square w-full h-auto overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant box-border">
                <EntityThumbnail
                    fill
                    src={icon}
                    alt={iconAlt}
                    imageDisplayMode={imageDisplayMode}
                    fillColor={color}
                ></EntityThumbnail>
            </Link>
            <Link href={href} className="max-w-full"><h3 className="overflow-clip text-ellipsis text-on-surface transition-colors hover:text-inherit text-center font-semibold text-2xl">{titleContent}</h3></Link>
            {trailingTitleContent ? <section className="text-on-surface-variant items-center justify-center text-xl inline text-center">
                <h3 className="w-fit font-semibold inline">{trailingTitleContent}</h3>
                <span className="w-fit inline">{trailingSupporting}</span>
            </section> : undefined}
        </article>
    )
}