import Link from "next/link"
import { MouseEventHandler } from "react"
import { Icon } from "./icon"

export function FilledButton(
    {
        text,
        icon,
        href,
        onClick,
        className = ''
    }: {
        text: string
        icon?: string
        href?: string
        onClick?: MouseEventHandler
        className?: string
    }
) {
    const iconElement = icon ? <Icon icon={icon}/> : undefined
    return (
        href ? (
            <Link
                className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`}
                href={href}
                onClick={onClick}>
                {iconElement}
                {text}
            </Link>
        ) : (
            <button
                className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`}
                onClick={onClick}>
                {iconElement}
                {text}
            </button>
        )
    )
}