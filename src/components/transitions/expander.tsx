import { useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"

const transitionStyles: { [key in TransitionStatus]: String } = {
    entering: 'grid-rows-[1fr_0fr]',
    entered: 'grid-rows-[1fr_0fr]',
    exiting: 'grid-rows-[0fr_0fr]',
    exited: 'grid-rows-[0fr_0fr]',
    unmounted: 'grid-rows-[0fr_0fr]'
}

const overflowTransitionStyles: { [key in TransitionStatus]: String } = {
    entering: 'overflow-hidden',
    entered: '',
    exiting: 'overflow-hidden',
    exited: 'overflow-hidden',
    unmounted: 'overflow-hidden'
}

export function Expander(
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
            nodeRef={divRef}
            in={visible}
            timeout={duration}
        >
            {state => (
                <div ref={divRef}
                    className={`transition grid ${transitionStyles[state]} ${className}`}
                    style={{
                        transitionProperty: 'grid-template-rows',
                        transitionDuration: `${duration}ms`,
                    }}
                >
                    <div className={`${overflowTransitionStyles[state]} w-full`}>
                        {children}
                    </div>
                </div>
            )}
        </Transition>
    )

}