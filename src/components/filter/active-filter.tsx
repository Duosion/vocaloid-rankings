import { useState } from "react"
import { Icon } from "../material/icon"

export function ActiveFilter(
    {
        name,
        icon = 'close',
        iconAlwaysVisible = false,
        filled = false,
        onClick
    }: {
        name?: string
        icon?: string
        iconAlwaysVisible?: boolean
        filled?: boolean
        onClick?: () => void
    }
) {
    const [hovering, setHovering] = useState(false)

    const className = `px-3 py-1 rounded-lg box-border whitespace-nowrap flex items-center justify-center gap-2${name ? (filled ? " text-inverse-on-surface bg-inverse-surface border border-inverse-surface" : " text-on-background border border-on-background") : " h-8 w-24 bg-surface-container-lowest box-border whitespace-nowrap"}`
    return (
        <li
            key={name}
            onMouseEnter={_ => setHovering(true)}
            onMouseLeave={_ => setHovering(false)}
        >
            <button className={className} onClick={() => {
                if (onClick) {
                    onClick()
                }
            }}>
                {name}
                <Icon
                    className="transition-opacity"
                    icon={icon}
                    style={{
                        opacity: hovering || iconAlwaysVisible ? 1 : 0,
                        display: hovering || iconAlwaysVisible ? "block" : 'none'
                    }}
                />
            </button>
        </li>
    )
}