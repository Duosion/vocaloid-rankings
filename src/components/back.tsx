'use client'
import { MouseEventHandler, SyntheticEvent } from "react"
import { IconButton } from "./material"
import { useRouter } from "next/navigation"

export default function BackButton(
    {
        referer
    }: {
        referer?: string
    }
) {
    const router = useRouter()
    const handleClick: MouseEventHandler = (event: SyntheticEvent) => {
        event.preventDefault()
        // go back a page
        router.back()
    }

    return (
        <IconButton
            icon='arrow_back'
            href={referer}
            onClick={handleClick}
        />
    )
}