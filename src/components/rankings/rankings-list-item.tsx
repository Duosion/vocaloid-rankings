import Link from "next/link"
import SongThumbnail from "../song-thumbnail"
import { Transition, TransitionStatus } from "react-transition-group"
import { CSSProperties, useEffect, useRef, useState } from "react"

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
        iconPosition,
        iconAlt,
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
        iconPosition?: string,
        iconAlt: string
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
                    <Link href={href} className="sm:block hidden rounded-xl border border-outline-variant box-border"><SongThumbnail src={icon} alt={iconAlt} width={50} height={50} overflowHeight={70} overflowWidth={70} /></Link>
                    <section className="flex flex-col gap flex-1 text-inherit">
                        <h3 className="text-on-surface overflow-clip text-ellipsis hover:text-inherit"><Link href={href} className="font-semibold transition-colors text-inherit text-xl">{titleContent}</Link></h3>
                        {supportingContent}
                    </section>
                    <section className="flex flex-col gap items-end mr-4">
                        <h3 className="text-on-surface text-xl font-semibold">{trailingTitleContent}</h3>
                        <span className="text-on-surface-variant text-md">{trailingSupporting}</span>
                    </section>
                </li>
            )}
        </Transition>
    )
}