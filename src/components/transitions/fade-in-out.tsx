import { timeoutDebounce } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

export function FadeInOut(
    {
        visible = false,
        duration = 150,
        children
    }: {
        visible?: boolean,
        duration?: number
        children?: React.ReactNode
    }
) {
    const [isVisible, setIsVisible] = useState(visible)
    const [transitioning, setTransitioning] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (!visible) {
            setTransitioning(true)
            timeoutDebounce(timeoutRef, duration, () => setTransitioning(false))
        }
        setIsVisible(visible)
    }, [visible])

    return (
        <div className="transition-opacity" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0px)' : 'translateY(3px)', transitionDuration: `${duration}ms`, transitionProperty: 'opacity, transform' }}>
            {isVisible || transitioning ? children : undefined}
        </div>
    )

}