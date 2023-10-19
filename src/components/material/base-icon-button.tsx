import Link from "next/link"
import { Icon } from "./icon"
import { CSSProperties, MouseEventHandler } from "react"

export function BaseIconButton(
    {
        icon,
        className = '',
        href = '',
        style,
        onClick
    }: {
        
        icon: string
        className?: string
        href?: string
        style?: CSSProperties
        onClick?: MouseEventHandler
    }
) {
    const finalClassName = `w-[40px] h-[40px] rounded-full flex items-center justify-center ${className}`
    return (
        href ? (
            <Link className={finalClassName} href={href} onClick={onClick} style={style}>
                <Icon icon={icon}/>
            </Link>
        ) : (
            <button className={finalClassName} onClick={onClick} style={style}>
                <Icon icon={icon}/>
            </button>
        )
    )
}