import { CSSProperties } from "react"

export function Icon(
    {
        icon,
        className = '',
        style
    }: {
        icon: string
        className?: string
        style?: CSSProperties
    }
) {
    return (
        <span className={`h-6 w-6 symbol ${className}`} style={style}>{icon}</span>
    )
}