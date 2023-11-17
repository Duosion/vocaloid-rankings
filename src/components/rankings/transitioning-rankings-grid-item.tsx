import Link from "next/link"
import { CSSProperties, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import { ImageDisplayMode } from '..'
import EntityThumbnail from '../entity-thumbnail'
import { RankingsGridItem } from "./rankings-grid-item"

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

export function TransitioningRankingsGridItem(
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
        color,
        timeout = 150
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
        timeout?: number
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
            timeout={timeout}
        >
            {state => (
                <RankingsGridItem
                    key={key}
                    href={href}
                    titleContent={titleContent}
                    placement={placement}
                    icon={icon}
                    iconAlt={iconAlt}
                    imageDisplayMode={imageDisplayMode}
                    trailingTitleContent={trailingTitleContent}
                    trailingSupporting={trailingSupporting}
                    className={className}
                    color={color}
                    style={transitionStyles[state]}
                />
            )}
        </Transition>
    )
}