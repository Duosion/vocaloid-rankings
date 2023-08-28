'use client'

import { Icon } from "@/components/material"
import { LanguageDictionary, LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { CSSProperties, createContext, useContext, useEffect, useRef, useState } from "react"
import { TransitionStatus } from "react-transition-group"
import { Filter, FilterType, RankingsFilters, RankingsFiltersValues, SelectFilter } from "./types"

const modalTransitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: { opacity: 1, display: 'flex' },
    entered: { opacity: 1, display: 'flex' },
    exiting: { opacity: 0, display: 'hidden' },
    exited: { opacity: 0, display: 'none' },
    unmounted: {}
}

const FilterValuesContext = createContext<RankingsFiltersValues>({})

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
        filters,
        langDict,
        values,
    }: {
        href: string
        filters: RankingsFilters
        langDict: LanguageDictionary
        values: RankingsFiltersValues
    }
) {
    const router = useRouter()

    const [filterValues, setFilterValues] = useState(values)

    function saveFilterValues() {
        // set url
        const queryBuilder = []
        for (const key in filterValues) {
            const value = filterValues[key as keyof typeof filterValues]
            const filter = filters[key as keyof typeof filters]
            if (value && filter) {
                queryBuilder.push(filter.defaultValue ? '' : `${key}=${value}`)
            }
        }
        setFilterValues({ ...filterValues })
        // set url
        router.push(`${href}?${queryBuilder.join('&')}`)
    }

    // build active filters
    const activeFilters: React.ReactNode[] = []
    for (const key in filterValues) {
        let filter = filters[key as keyof typeof filters] as Filter
        const value = Number(filterValues[key as keyof typeof filters])

        switch (filter.type) {
            case FilterType.SELECT: {
                const valueNumber = Number(value)
                const defaultValue = (filter as SelectFilter<number>).defaultValue
                const options = (filter as SelectFilter<number>).values
                const parsedValue = isNaN(valueNumber) ? defaultValue : valueNumber
                if (parsedValue != defaultValue) {
                    const name = options[parsedValue].name
                    activeFilters.push(<ActiveFilter name={name in langDict ? langDict[name as LanguageDictionaryKey] : name} onClick={() => { filterValues[key as keyof typeof filters] = defaultValue; saveFilterValues() }} />)
                }
                break
            }
        }
    }

    return (
        <FilterValuesContext.Provider value={filterValues}>
            <ul className="flex flex-col gap-5 w-full mt-5">
                <li key='filters'><ul className="flex gap-5">
                    <SelectFilterElement filter={filters.sourceType} langDict={langDict} onValueChanged={(newValue) => { filterValues.sourceType = newValue; saveFilterValues() }} />
                    <SelectFilterElement filter={filters.timePeriod} langDict={langDict} onValueChanged={(newValue) => { filterValues.timePeriod = newValue; saveFilterValues() }} />
                    <SelectFilterElement filter={filters.year} langDict={langDict} onValueChanged={(newValue) => { filterValues.year = newValue; saveFilterValues() }} />
                    <SelectFilterElement filter={filters.songType} langDict={langDict} onValueChanged={(newValue) => { filterValues.songType = newValue; saveFilterValues() }} />
                </ul></li>
                {activeFilters.length > 0 &&
                    <li key='activeFilters'><ul className="flex gap-3">
                        {activeFilters}
                    </ul></li>
                }
            </ul>
        </FilterValuesContext.Provider>
    )
}

export function SelectFilterElement(
    {
        filter,
        langDict,
        onValueChanged
    }: {
        filter: SelectFilter<number>
        langDict: LanguageDictionary
        onValueChanged?: (newValue: number) => void
    }
) {
    const defaultValue = filter.defaultValue

    const [modalOpen, setModalOpen] = useState(false)

    // parse filter value
    const rawFilterValues = useContext(FilterValuesContext)
    const rawFilterValue = Number(rawFilterValues[filter.key as keyof typeof rawFilterValues])
    const filterValue = isNaN(rawFilterValue) ? defaultValue : rawFilterValue

    const modalRef = useRef<HTMLUListElement>(null)

    const options = filter.values

    const filterValueName = options[filterValue].name

    const valueIsDefault = filterValue == defaultValue

    const setValue = (newValue: number) => {
        if (filterValue != newValue && onValueChanged) {
            onValueChanged(newValue)
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
        <FilterElement key={filter.key} name={langDict[filter.name]}>
            <button className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={() => setModalOpen(true)}>
                <span className={`bg-transparent w-32 outline-none cursor-pointer text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}>{filterValueName in langDict ? langDict[filterValueName as LanguageDictionaryKey] : filterValueName}</span>
                {valueIsDefault ? <Icon icon='expand_more'></Icon> : <Icon icon='close'></Icon>}
            </button>
            {modalOpen && <div className="relative w-full h-0 transition-opacity z-10">
                <ul ref={modalRef} className="absolute top-2 left-0 w-full rounded-xl bg-surface-container-high shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip">
                    {options.map((value, index) => {
                        const name = value.name
                        return (
                            <li key={index}>
                                <button key={index} onClick={() => { setValue(index) }} className="w-full font-normal h-auto overflow-clip text-ellipsis p-2 rounded-xl relative transition-colors hover:bg-surface-container-highest">{name in langDict ? langDict[name as LanguageDictionaryKey] : name}</button>
                            </li>
                        )
                    })}
                </ul>
            </div>}
        </FilterElement>
    )

}