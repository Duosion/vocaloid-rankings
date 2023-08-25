'use client'

import { FilterBarFilters, FilterBarSelectFilter, FilterType, RankingsFilterSearchParams } from "./types"
import { Icon, IconButton } from "@/components/material"
import { useRouter } from "next/navigation"
import { CSSProperties, InputHTMLAttributes, MutableRefObject, useEffect, useRef, useState } from "react"
import { Transition, TransitionStatus } from "react-transition-group"
import { useSettings } from "../settings/SettingsProvider"

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
        <li key={name} className="w-fit h-fit flex flex-col font-bold">
            <h3 className="text-on-background text-lg mb-2">{name}</h3>
            {children}
        </li>
    )
}

function ActiveFilter(
    {
        name,
        onClick
    }: {
        name: string,
        onClick?: () => void
    }
) {
    return (
        <li key={name}>
            <button className="px-3 py-1 rounded-lg text-on-primary bg-primary" onClick={() => {
                if (onClick) {
                    onClick()
                }
            }}>{name}</button>
        </li>
    )
}

export function FilterBar(
    {
        href,
        filters
    }: {
        href: string,
        filters: FilterBarFilters
    }
) {
    const router = useRouter()
    const { settings, setRankingsFilter } = useSettings()

    const [filterValues, setFilterValues] = useState(filters.map((filter) => filter.value))

    function onValueChanged(key: number, newValue: any) {
        filterValues[key] = newValue
        setFilterValues(filterValues)
        // set url
        const cookieParams: RankingsFilterSearchParams = {}
        router.push(`${href}?${filters.map((filter, key) => {
            const value = filterValues[key]
            const filterKey = filter.key
            // build cookie params
            cookieParams[filterKey as keyof typeof cookieParams] = value
            // build query
            return value == filter.defaultValue ? '' : `${filterKey}=${value}`
        }).join('&')}`)
        
        // save cookie
        setRankingsFilter(cookieParams)
    }

    const activeFilters: React.ReactNode[] = []

    return (
        <ul className="flex flex-col gap-5 w-full mt-5">
            <li key='filters'><ul className="flex gap-3">
                {filters.map((filter, key) => {

                    switch (filter.type) {
                        case FilterType.SELECT: {
                            // convert filter to the correct type
                            filter = filter as FilterBarSelectFilter
                            // check if it is active
                            const currentValueRaw = filterValues[key]
                            const defaultValue = filter.defaultValue
                            const currentValue = filter.values[currentValueRaw] ? currentValueRaw : defaultValue
                            if (currentValue != defaultValue) {
                                activeFilters.push(<ActiveFilter name={filter.values[currentValue]} onClick={() => onValueChanged(key, defaultValue)} />)
                            }
                            return (
                                <SelectFilterElement key={key} filter={filter} value={currentValue} onValueChanged={(newValue) => onValueChanged(key, newValue)} />
                            )
                        }
                    }

                    return null
                })}
            </ul></li>
            <li key='activeFilters'><ul className="flex gap-3">
                {activeFilters}
            </ul></li>
        </ul>

    )
}

export function SelectFilterElement(
    {
        filter,
        value,
        onValueChanged
    }: {
        filter: FilterBarSelectFilter,
        value: number,
        onValueChanged?: (newValue: number) => void
    }
) {
    const [modalOpen, setModalOpen] = useState(false)
    const [filterValue, setFilterValue] = useState(value)
    const modalRef = useRef<HTMLUListElement>(null)

    const options = filter.values
    const defaultValue = filter.defaultValue
    const valueIsDefault = filterValue == defaultValue

    const setValue = (newValue: number) => {
        if (filterValue != newValue) {
            setFilterValue(newValue)
            if (onValueChanged) {
                onValueChanged(newValue)
            }
        }
        setModalOpen(false)
    }

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setModalOpen(false)
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [modalOpen])

    return (
        <FilterElement name={filter.name}>
            <button className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={() => setModalOpen(true)}>
                <span className={`bg-transparent w-32 outline-none cursor-pointer text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}>{options[filterValue]}</span>
                {valueIsDefault ? <Icon icon='expand_more'></Icon> : <Icon icon='close'></Icon>}
            </button>
            {modalOpen && <div className="relative w-full h-0 transition-opacity z-10">
                <ul ref={modalRef} className="absolute top-2 left-0 w-full rounded-xl bg-surface-container-high shadow-md p-2">
                    {options.map((value, index) => {
                        return (
                            <li key={index}>
                                <button key={index} onClick={() => { setValue(index) }} className="w-full h-auto overflow-clip text-ellipsis p-2 rounded-xl relative before:transition-opacity before:absolute before:w-full before:h-full before:left-0 before:top-0 before:rounded-xl before:opacity-0 before:hover:bg-on-primary before:hover:opacity-[0.2] transition-opacity">{value}</button>
                            </li>
                        )
                    })}
                </ul>
            </div>}
        </FilterElement>
    )

}

/*export function SelectFilterElement(
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
}*/