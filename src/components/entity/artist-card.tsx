import Link from "next/link"
import EntityThumbnail from "../entity-thumbnail"
import { ImageDisplayMode } from "@/components"

export function ArtistCard(
    {
        src,
        alt,
        bgColor,
        href,
        title,
        text,
        isSinger = false,
        className = ''
    }: {
        src: string
        alt: string
        bgColor: string
        href: string
        title: React.ReactNode
        text?: string
        isSinger?: boolean
        className?: string
    }
) {
    return (
        <Link title={alt} className={`bg-surface-container text-on-surface rounded-2xl relative flex gap-3 items-center overflow-clip before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-2xl before:bg-primary before:opacity-0 hover:before:opacity-[0.03] hover:text-primary before:transition-opacity ${className}`} href={href}>
            <figure className="h-14 w-14 aspect-square m-2 box-border">
                <EntityThumbnail
                    fill
                    src={src}
                    alt={alt}
                    imageDisplayMode={isSinger ? ImageDisplayMode.VOCALIST : ImageDisplayMode.PRODUCER}
                    fillColor={bgColor}
                />
            </figure>
            <section className="flex flex-col py-1 overflow-hidden mr-2">
                <h4 className="text-xl font-semibold w-full whitespace-nowrap overflow-clip text-ellipsis text-inherit transition-colors">{title}</h4>
                {text ? <span className="text-md text-on-surface-variant w-full whitespace-nowrap overflow-clip text-ellipsis">{text}</span> : undefined}
            </section>
        </Link>
    )
}