'use client'

import { FormEventHandler, SyntheticEvent } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "./material/icon"

export const SearchBar = (
    {
        placeholder = "Search",
        className = ''
    }: {
        placeholder?: string
        className?: string
    }
) => {
    const router = useRouter()

    const handleSubmit: FormEventHandler = (event: SyntheticEvent) => {
        event.preventDefault()
        const target = event.target as typeof event.target & {
            query: { value: string };
        };
        router.push(`/search?query=${target.query.value}`)
        target.query.value = ''
    }

    return (
        <form action='/search' method='GET' className={`bg-surface-container-low w-full h-10 flex items-center justify-start px-4 gap-4 rounded-full ${className}`} onSubmit={handleSubmit}>
            <Icon icon='search' className='text-on-surface'/>
            <input
                required
                id='query'
                name='query'
                type='text'
                placeholder={placeholder}
                className="w-full text-on-surface text-basic bg-transparent"
            />
        </form>
    )
}