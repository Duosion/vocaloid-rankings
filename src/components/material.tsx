import Link from "next/link"
import { MouseEventHandler } from "react"

export const IconButton = (
    {
        icon,
        href,
        onClick
    }: {
        icon: string
        href?: string
        onClick?: MouseEventHandler
    }
) => {
    return (
        href ? (
            <Link className="link-icon-button w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors" href={href} onClick={onClick}>
                <Icon icon={icon}/>
            </Link>
        ) : (
            <button className="link-icon-button w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors" onClick={onClick}>
                <Icon icon={icon}/>
            </button>
        )
    )
}

export const FilledButton = (
    {
        text,
        href,
        onClick,
        className
    }: {
        text: string
        href?: string
        onClick?: MouseEventHandler
        className?: string
    }
) => {
    return (
        href ? (
            <Link className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`} href={href} onClick={onClick}>{text}</Link>
        ) : (
            <button className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`} onClick={onClick}>{text}</button>
        )
    )
}

export const Icon = (
    {
        icon,
        className
    }: {
        icon: string
        className?: string
    }
) => {
    return (
        <span className={`h-[24px] w-[24px] symbol ${className}`}>{icon}</span>
    )
}