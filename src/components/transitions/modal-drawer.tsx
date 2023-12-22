import { CSSProperties, useEffect, useRef } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import { Scrim } from "./scrim"

export enum ModalDrawerSide {
    LEFT,
    RIGHT
}

type TransitionStyles = { [key in TransitionStatus]: CSSProperties }

const drawerTransitionStyles: { [key in ModalDrawerSide]: TransitionStyles } = {
    [ModalDrawerSide.LEFT]: {
        entering: {
            opacity: 1,
            transform: 'translateX(0px)'
        },
        entered: {
            opacity: 1,
            transform: 'translateX(0px)'
        },
        exiting: {
            opacity: 0,
            transform: 'translateX(-360px)'
        },
        exited: {
            opacity: 0,
            transform: 'translateX(-360px)'
        },
        unmounted: {
            opacity: 0,
            transform: 'translateX(-360px)'
        }
    },
    [ModalDrawerSide.RIGHT]: {
        entering: {
            opacity: 1,
            transform: 'translateX(0px)'
        },
        entered: {
            opacity: 1,
            transform: 'translateX(0px)'
        },
        exiting: {
            opacity: 0,
            transform: 'translateX(360px)'
        },
        exited: {
            opacity: 0,
            transform: 'translateX(360px)'
        },
        unmounted: {
            opacity: 0,
            transform: 'translateX(360px)'
        }
    },
}

const containerStyles: { [key in ModalDrawerSide]: CSSProperties } = {
    [ModalDrawerSide.LEFT]: {
        top: '0px',
        left: '0px',
        justifyContent: 'flex-start'
    },
    [ModalDrawerSide.RIGHT]: {
        top: '0px',
        right: '0px',
        justifyContent: 'flex-end'
    }
}

const modalStyles: { [key in ModalDrawerSide]: CSSProperties } = {
    [ModalDrawerSide.LEFT]: {
        borderTopRightRadius: '1.5rem',
        borderBottomRightRadius: '1.5rem'
    },
    [ModalDrawerSide.RIGHT]: {
        borderTopLeftRadius: '1.5rem',
        borderBottomLeftRadius: '1.5rem'
    }
}

export function ModalDrawer(
    {
        side = ModalDrawerSide.LEFT,
        visible,
        duration = 150,
        children,
        className = '',
        onClose
    }: {
        side?: ModalDrawerSide
        visible?: boolean
        duration?: number
        children?: React.ReactNode
        className?: string
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
                <div 
                ref={modalContainerRef} 
                className={`fixed w-screen h-screen flex items-start box-border z-50 ${className}`}
                style={containerStyles[side]}
                >
                    {/* modal scrim */}
                    <Scrim duration={duration} state={state}/>
                    {/* modal */}
                    <div
                        ref={modalRef}
                        className="transition-all max-w-[85%] w-[360px] px-5 py-5 max-h-screen h-full overflow-y-auto box-border bg-surface-container-lowest z-50 flex flex-col gap-5"
                        style={{
                            transitionDuration: `${duration}ms`,
                            ...modalStyles[side],
                            ...drawerTransitionStyles[side][state]
                        }}
                    >
                        {children}
                    </div>
                </div>
            )}
        </Transition>
    )
}