import Link from "next/link"
import { Icon } from "./icon"
import { MouseEventHandler } from "react"

export function BaseIconButton(
    {
        icon,
        className = '',
        href = '',
        onClick
    }: {
        
        icon: string
        className?: string
        href?: string
        onClick?: MouseEventHandler
    }
) {
    const finalClassName = `w-[40px] h-[40px] rounded-full flex items-center justify-center ${className}`
    return (
        href ? (
            <Link className={finalClassName} href={href} onClick={onClick}>
                <Icon icon={icon}/>
            </Link>
        ) : (
            <button className={finalClassName} onClick={onClick}>
                <Icon icon={icon}/>
            </button>
        )
    )
}