import { CSSProperties } from "react";
import { TransitionStatus } from "react-transition-group";

const transitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(2px) saturate(2)'
    },
    entered: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(2px) saturate(2)'
    },
    exiting: {
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'none'
    },
    exited: {
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'none'
    },
    unmounted: {
        backgroundColor: 'rgba(0,0,0,0)',
        backdropFilter: 'none'
    }
}

export function Scrim(
    {
        duration,
        state
    }: {
        duration: number,
        state: TransitionStatus
    }
) {
    return (
        <div
            className="absolute w-full h-full top-0 left-0 transition-all before:w-full before:h-full"
            style={{
                transitionDuration: `${duration}ms`,
                ...transitionStyles[state]
            }}
        />
    )
}