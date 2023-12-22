import Link from "next/link"
import { MouseEventHandler } from "react"
import { Icon } from "./icon"

export function FilledButton(
    {
        text,
        icon,
        href,
        onClick,
        className = '',
        disabled = false
    }: {
        text: string
        icon?: string
        href?: string
        onClick?: MouseEventHandler
        className?: string
        disabled?: boolean
    }
) {
    const iconElement = icon ? <Icon icon={icon}/> : undefined
    return (
        href ? (
            <Link
                aria-disabled={disabled}
                className={`text-base bg-primary text-on-primary h-[40px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${icon ? 'pl-4 pr-6 gap-2' : 'px-6'} ${className}`}
                href={href}
                onClick={onClick}>
                {iconElement}
                {text}
            </Link>
        ) : (
            <button
                aria-disabled={disabled}
                className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${icon ? 'pl-4 pr-6 gap-2' : 'px-6'} ${className}`}
                onClick={onClick}>
                {iconElement}
                {text}
            </button>
        )
    )
}