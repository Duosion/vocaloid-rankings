import { CSSProperties, useEffect, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"

const scrimTransitionStyles: { [key in TransitionStatus]: CSSProperties } = {
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

const modalTransitionStyles: { [key in TransitionStatus]: CSSProperties } = {
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
                <div ref={modalContainerRef} className='absolute w-full h-full top-0 left-0 flex items-start justify-center p-5 pt-36 box-border z-50'>
                    {/* modal scrim */}
                    <div
                        className="absolute w-full h-full top-0 left-0 transition-all before:w-full before:h-full"
                        style={{
                            transitionDuration: `${duration}ms`,
                            ...scrimTransitionStyles[state]
                        }}
                    />
                    {/* modal */}
                    <div
                        ref={modalRef}
                        className="transition-all w-full max-w-screen-md p-5 max-h-full overflow-y-auto box-border bg-surface-container-lowest rounded-2xl z-50 flex flex-col gap-5"
                        style={{
                            transitionDuration: `${duration}ms`,
                            ...modalTransitionStyles[state]
                        }}
                    >
                        {children}
                    </div>
                </div>
            )}
        </Transition>
    )

}