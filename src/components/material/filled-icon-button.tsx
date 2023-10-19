import { CSSProperties, MouseEventHandler } from "react"
import { BaseIconButton } from "./base-icon-button"

export function FilledIconButton(
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
        <BaseIconButton icon={icon} className="bg-primary text-on-primary relative before:bg-surface-container-low before:absolute before:w-full before:h-full before:rounded-full before:opacity-0 hover:before:opacity-20 before:transition-opacity" href={href} onClick={onClick} style={style}/>
    )
}