'use client'

import { ClientFilterValue, SelectFilterValue } from "./types"
import { Icon } from "@/components/material"
import { CSSProperties, InputHTMLAttributes, MutableRefObject, useRef, useState } from "react"
import { Transition, TransitionStatus } from "react-transition-group"

const modalTransitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: { opacity: 1, display: 'flex' },
    entered: { opacity: 1, display: 'flex' },
    exiting: { opacity: 0, display: 'hidden' },
    exited: { opacity: 0, display: 'none' },
    unmounted: {}
}

function FilterElement(
    {
        name,
        children
    }: {
        name: string,
        children?: React.ReactNode
    }
) {
    return (
        <div className="w-fit h-fit flex flex-col font-bold">
            <div className="text-on-background text-lg mb-2">{name}</div>
            {children}
        </div>
    )
}

export function SelectFilterElement(
    {
        name,
        defaultValue,
        values,
        value = null,
        onValueChanged
    }: {
        name: string
        defaultValue: number
        values: ClientFilterValue[]
        value?: number | null,
        onValueChanged?: (value: number | null) => void
    }
) {
    const [modalOpen, setModalOpen] = useState(false)
    const [displayValue, setDisplayValue] = useState(values[value == null ? defaultValue : value].name)
    const [filterValue, setFilterValue] = useState(value)
    const modalRef = useRef(null)
    let nameInput: HTMLInputElement | null

    function focus() {
        if (nameInput) {
            nameInput.focus()
        }
    }

    const placeholder = (values[defaultValue] || values[0]).name

    return (
        <FilterElement name={name}>
            <button className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={() => focus()}>
                <input ref={(element) => { nameInput = element }} className="bg-transparent w-32 placeholder:text-on-surface-variant text-primary outline-none cursor-pointer" type='text' placeholder={placeholder} value={displayValue} onBlur={() => { setModalOpen(false) }} onFocus={() => setModalOpen(true)} readOnly />
                <Icon icon='expand_more'></Icon>
            </button>
            <Transition nodeRef={modalRef} in={modalOpen} timeout={500}>
                {state => (
                    <div ref={modalRef} className="relative w-full h-0 transition-opacity z-10 duration-1000" style={{ display: 'none', ...modalTransitionStyles[state] }}>
                        <div className="absolute top-2 left-0 w-full rounded-xl bg-surface-container-high shadow-md p-2">
                            {values.map(value => {
                                const val = value.value
                                return (
                                    <button key={value.value} onClick={() => {
                                        setDisplayValue(value.name)
                                        if (filterValue != val) {
                                            setFilterValue(val)
                                            if (onValueChanged) {
                                                onValueChanged(val)
                                            }
                                        }
                                    }} className="w-full h-auto overflow-clip text-ellipsis p-2 rounded-xl relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-xl before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.2] transition-opacity">{value.name}</button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </Transition>
        </FilterElement>
    )
}