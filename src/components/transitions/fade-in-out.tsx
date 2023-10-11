import { timeoutDebounce } from "@/lib/utils"
import { CSSProperties, useEffect, useRef, useState } from "react"
import { Transition, TransitionStatus } from "react-transition-group"

const transitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: {
        opacity: 1,
        transform: 'translateY(0px)'
    },
    entered: {
        opacity: 1,
        transform: 'translateY(0px)'
    },
    exiting: {
        opacity: 0,
        transform: 'translateY(5px)'
    },
    exited: {
        opacity: 0,
        transform: 'translateY(5px)'
    },
    unmounted: {
        opacity: 0,
        transform: 'translateY(5px)'
    }
}

export function FadeInOut(
    {
        visible = false,
        className = '',
        duration = 150,
        children,
    }: {
        visible?: boolean
        className?: string
        duration?: number
        children?: React.ReactNode
    }
) {
    const divRef = useRef<HTMLDivElement>(null)

    return (
        <Transition
            mountOnEnter
            unmountOnExit
            nodeRef={divRef}
            in={visible}
            timeout={duration}
        >
            {state => (
                <div ref={divRef}
                    className={`transition-opacity ${className}`}
                    style={{
                        transitionDuration: `${duration}ms`,
                        transitionProperty: 'opacity, transform',
                        ...transitionStyles[state]
                    }}
                >
                    {children}
                </div>
            )}
        </Transition>
    )

}