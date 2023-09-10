import { MouseEventHandler } from "react"
import { BaseIconButton } from "./base-icon-button"

export function IconButton(
    {
        icon,
        href,
        onClick
    }: {
        icon: string
        href?: string
        onClick?: MouseEventHandler
    }
) {
    return (
        <BaseIconButton icon={icon} className="hover:bg-surface-container-low transition-colors" href={href} onClick={onClick} />
    )
}