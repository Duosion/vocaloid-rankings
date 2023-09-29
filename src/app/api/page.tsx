'use client'

import { FilledButton } from "@/components/material/filled-button"
import { FormEvent, MutableRefObject, useRef, useState } from "react"

export default function ApiPage() {
    const [response, setResponse] = useState('')

    const inputRef: MutableRefObject<HTMLTextAreaElement | null> = useRef(null)

    const onSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault()
        fetch('/api/v1',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: inputRef.current?.value,
                variables: {id: 520007}
            })
        }).then(response => response.json())
        .then(json => { setResponse(JSON.stringify(json, undefined, 5)) })
    }

    return (
        <ul>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <h2 className="text-lg text-on-background">Input</h2>
                <textarea ref={inputRef}/>
                <FilledButton text='Submit'/>
            </form>
            <h2 className="text-lg text-on-background">Output</h2>
            <div style={{whiteSpace: 'break-spaces'}}>{response}</div>
        </ul>
    )
}