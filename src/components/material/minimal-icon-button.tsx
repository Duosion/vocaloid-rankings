import { MouseEventHandler } from "react"
import { BaseIconButton } from "./base-icon-button"
import { Icon } from "./icon"

export function MinimalIconButton(
    {
        icon,
        onClick
    }: {
        icon: string
        onClick?: MouseEventHandler
    }
) {
    return (
        <button onClick={onClick} className="text-on-surface-variant hover:text-on-surface transition-colors h-6 w-6"><Icon icon={icon} /></button>
    )
}