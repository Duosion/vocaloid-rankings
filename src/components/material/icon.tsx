import { HTMLAttributes } from "react"

export function Icon(
    {
        icon,
        className
    }: {
        icon: string
        className?: string
    }
) {
    return (
        <span className={`h-6 w-6 symbol ${className}`}>{icon}</span>
    )
}