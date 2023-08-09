'use client'

import { FormEventHandler, SyntheticEvent } from "react"
import { Icon } from "./material"
import { useRouter } from "next/navigation"

export const SearchBar = (
    {
        placeholder = "Search",
    }: {
        placeholder?: string
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
        <form action='/search' method='GET' className='bg-surface-1 min-w-[360px] max-w-[420px] w-full h-[40px] flex items-center justify-start px-[16px] gap-[16px] rounded-full' onSubmit={handleSubmit}>
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