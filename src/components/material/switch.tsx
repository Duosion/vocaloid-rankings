import { CSSProperties, MouseEventHandler, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import { Icon } from "./icon"

export enum MaterialSwitchConfiguration {
    NO_ICONS,
    SELECTED_ICON,
    ICONS
}

type transitionStyles = { [key in TransitionStatus]: CSSProperties }

const trackTransitionStyles: transitionStyles = {
    entering: {
        borderColor: 'var(--md-sys-color-primary)',
        backgroundColor: 'var(--md-sys-color-primary)'
    },
    entered: {
        borderColor: 'var(--md-sys-color-primary)',
        backgroundColor: 'var(--md-sys-color-primary)'
    },
    exiting: {
        borderColor: 'var(--md-sys-color-outline)',
        backgroundColor: 'var(--md-sys-color-surface-container-highest)'
    },
    exited: {
        borderColor: 'var(--md-sys-color-outline)',
        backgroundColor: 'var(--md-sys-color-surface-container-highest)'
    },
    unmounted: {
        borderColor: 'var(--md-sys-color-outline)',
        backgroundColor: 'var(--md-sys-color-surface-container-highest)'
    }
}

const handleTransitionStyles: transitionStyles = {
    entering: {
        backgroundColor: 'var(--md-sys-color-on-primary)'
    },
    entered: {
        backgroundColor: 'var(--md-sys-color-on-primary)'
    },
    exiting: {
        backgroundColor: 'var(--md-sys-color-outline)'
    },
    exited: {
        backgroundColor: 'var(--md-sys-color-outline)'
    },
    unmounted: {
        backgroundColor: 'var(--md-sys-color-outline)'
    }
}

const handleNoIconsTransitionStyles: transitionStyles = {
    entering: {
        width: '24px',
        height: '24px',
        transform: 'translateX(22px) translateY(2px)'
    },
    entered: {
        width: '24px',
        height: '24px',
        transform: 'translateX(22px) translateY(2px)'
    },
    exiting: {
        width: '16px',
        height: '16px',
        transform: 'translateX(6px) translateY(6px)'
    },
    exited: {
        width: '16px',
        height: '16px',
        transform: 'translateX(6px) translateY(6px)'
    },
    unmounted: {
        width: '16px',
        height: '16px',
        transform: 'translateX(6px) translateY(6px)'
    }
}

const handleIconsTransitionStyles: transitionStyles = {
    entering: {
        width: '24px',
        height: '24px'
    },
    entered: {
        width: '24px',
        height: '24px'
    },
    exiting: {
        width: '24px',
        height: '24px'
    },
    exited: {
        width: '24px',
        height: '24px'
    },
    unmounted: {
        width: '24px',
        height: '24px'
    }
}

export function Switch(
    {
        selected,
        config = MaterialSwitchConfiguration.NO_ICONS,
        onClick,
        transitionDuration = 150
    }: {
        selected: boolean
        config?: MaterialSwitchConfiguration
        onClick?: MouseEventHandler<HTMLButtonElement>
        transitionDuration?: number
    }
) {
    const nodeRef = useRef<HTMLButtonElement>(null)
    const transitionDurationCss = `${transitionDuration}ms`

    return (
        <Transition
            nodeRef={nodeRef}
            in={selected}
            timeout={transitionDuration}
        >
            {state => (
                <button ref={nodeRef} onClick={onClick} className={`w-[52px] rounded-full h-8 box-border border-2 transition-all cursor-pointer relative`} style={{
                    transitionDuration: transitionDurationCss,
                    ...trackTransitionStyles[state]
                }}>
                    {/* handle */}
                    <div className="rounded-full absolute transition-all flex items-center justify-center top-0 left-0" style={{
                        transitionDuration: transitionDurationCss,
                        ...handleTransitionStyles[state],
                        ...handleNoIconsTransitionStyles[state]
                    }}>
                    </div>
                </button>
            )}
        </Transition>
    )
}