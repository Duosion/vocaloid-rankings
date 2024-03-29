import Link from "next/link"
import EntityThumbnail from "../entity-thumbnail"
import { Transition, TransitionStatus } from "react-transition-group"
import { CSSProperties, useRef } from "react"
import { ImageDisplayMode } from "@/components"

const transitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: {
        opacity: 1
    },
    entered: {
        opacity: 1
    },
    exiting: {
        opacity: 0
    },
    exited: {
        opacity: 0
    },
    unmounted: {
        opacity: 0
    }
}

export function RankingListItem(
    {
        key,
        href,
        titleContent,
        placement,
        icon,
        iconAlt,
        imageDisplayMode = ImageDisplayMode.SONG,
        trailingTitleContent,
        supportingContent,
        trailingSupporting,
        in: inProp = false,
        className = '',
        color
    }: {
        key: string
        href: string
        titleContent: React.ReactNode
        placement: number
        icon: string
        iconAlt: string
        imageDisplayMode?: ImageDisplayMode
        trailingTitleContent: React.ReactNode,
        supportingContent?: React.ReactNode
        trailingSupporting?: string,
        in?: boolean
        className?: string
        color?: string
    }
) {
    const nodeRef = useRef<HTMLLIElement>(null)

    return (
        <Transition
            mountOnEnter
            unmountOnExit
            in={inProp}
            key={key}
            nodeRef={nodeRef}
            timeout={150}
        >
            {state => (
                <li
                    ref={nodeRef}
                    key={key}
                    className={`py-2 rounded-2xl w-full flex gap-3 bg-surface-container box-border items-center transition-all ${className}`}
                    style={{
                        color: color,
                        ...transitionStyles[state]
                    }}
                >
                    <b className="ml-3 text-on-surface h-10 w-fit min-w-[40px] box-border flex items-center justify-center text-2xl font-extrabold">{placement}</b>
                    <Link href={href} className="block rounded-xl border border-outline-variant box-border">
                        <EntityThumbnail
                            src={icon}
                            alt={iconAlt}
                            width={50}
                            height={50}
                            imageDisplayMode={imageDisplayMode}
                            fillColor={color}
                        />
                    </Link>
                    <section className="flex flex-col gap flex-1 text-inherit overflow-hidden">
                        <Link href={href} className="text-on-surface overflow-clip text-ellipsis hover:text-inherit font-semibold transition-colors max-h-[2lh] line-clamp-2 sm:text-xl text-lg" title={iconAlt}>{titleContent}</Link>
                        {supportingContent}
                    </section>
                    <section className="flex flex-col gap items-end mr-4">
                        <h3 className="text-on-surface sm:text-xl text-lg font-semibold">{trailingTitleContent}</h3>
                        <span className="text-on-surface-variant text-md">{trailingSupporting}</span>
                    </section>
                </li>
            )}
        </Transition>
    )
}