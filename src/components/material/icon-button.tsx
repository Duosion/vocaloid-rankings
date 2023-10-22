import { CSSProperties, MouseEventHandler } from "react"
import { BaseIconButton } from "./base-icon-button"

export function IconButton(
    {
        icon,
        href,
        style,
        onClick
    }: {
        icon: string
        href?: string
        style?: CSSProperties
        onClick?: MouseEventHandler
    }
) {
    return (
        <BaseIconButton icon={icon} className="hover:bg-surface-container transition-colors" href={href} onClick={onClick} style={style}/>
    )
}