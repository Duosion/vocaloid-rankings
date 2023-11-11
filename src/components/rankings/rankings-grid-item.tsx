import Image from '@/components/image'
import Link from "next/link"
import { CSSProperties, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import EntityThumbnail from '../entity-thumbnail'
import { ImageDisplayMode } from '..'

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

export function RankingsGridItem(
    {
        key,
        href,
        titleContent,
        placement,
        icon,
        iconAlt,
        imageDisplayMode = ImageDisplayMode.SONG,
        trailingTitleContent,
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
        trailingTitleContent: React.ReactNode
        trailingSupporting?: string
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
                <article ref={nodeRef} key={key} className={`w-full flex flex-col gap-3 relative box-border items-center transition-all ${className}`} style={{
                    color: color,
                    ...transitionStyles[state]
                }}>
                    <div className="text-xl bg-inverse-surface text-inverse-on-surface rounded-xl absolute -left-5 -top-4 p-2 z-[5] font-black border border-outline-variant box-border">#{placement}</div>
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
                    <section className="text-on-surface-variant items-center justify-center text-xl inline text-center">
                        <h3 className="w-fit font-semibold inline">{trailingTitleContent}</h3>
                        <span className="w-fit inline">{trailingSupporting}</span>
                    </section>
                </article>
            )}
        </Transition>
    )
}