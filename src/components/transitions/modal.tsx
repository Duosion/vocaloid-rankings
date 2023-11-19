import { CSSProperties, useEffect, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import { Scrim } from "./scrim"

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
        transform: 'translateY(-20px)'
    },
    exited: {
        opacity: 0,
        transform: 'translateY(20px)'
    },
    unmounted: {
        opacity: 0,
        transform: 'translateY(20px)'
    }
}

export function Modal(
    {
        visible,
        duration = 150,
        children,
        onClose
    }: {
        visible?: boolean
        duration?: number
        children?: React.ReactNode
        onClose?: () => void
    }
) {
    const modalContainerRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            // close the modal if the click came outside of the modal
            if (modalRef.current && !modalRef.current.contains(event.target as Node) && onClose) {
                onClose()
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [visible, onClose])

    return (
        <Transition
            mountOnEnter
            unmountOnExit
            nodeRef={modalContainerRef}
            in={visible}
            timeout={duration}
        >
            {/* modal container */}
            {state => (
                <div ref={modalContainerRef} className='fixed w-full h-full top-0 left-0 flex items-start justify-center p-5 md:pt-36 box-border z-50'>
                    {/* modal scrim */}
                    <Scrim duration={duration} state={state}/>
                    {/* modal */}
                    <div
                        ref={modalRef}
                        className="transition-all w-full max-w-screen-lg p-5 max-h-full overflow-y-auto box-border bg-surface-container-lowest rounded-3xl z-50 flex flex-col gap-5"
                        style={{
                            transitionDuration: `${duration}ms`,
                            ...transitionStyles[state]
                        }}
                    >
                        {children}
                    </div>
                </div>
            )}
        </Transition>
    )
}