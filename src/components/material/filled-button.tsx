import Link from "next/link"
import { MouseEventHandler } from "react"

export function FilledButton(
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
) {
    return (
        href ? (
            <Link className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`} href={href} onClick={onClick}>{text}</Link>
        ) : (
            <button className={`text-base bg-primary text-on-primary h-[40px] px-[24px] rounded-full flex items-center justify-center relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-full before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.12] transition-opacity ${className}`} onClick={onClick}>{text}</button>
        )
    )
}