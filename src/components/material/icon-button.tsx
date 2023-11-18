import { CSSProperties, MouseEventHandler } from "react"
import { BaseIconButton } from "./base-icon-button"

export function IconButton(
    {
        icon,
        href,
        style,
        onClick,
        className = ''
    }: {
        icon: string
        href?: string
        style?: CSSProperties
        onClick?: MouseEventHandler
        className?: string
    }
) {
    return (
        <BaseIconButton icon={icon} className={`hover:bg-surface-container transition-colors ${className}`} href={href} onClick={onClick} style={style}/>
    )
}