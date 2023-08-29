'use client'

import { Icon } from "@/components/material"
import { LanguageDictionary, LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { CSSProperties, createContext, useContext, useEffect, useRef, useState } from "react"
import { TransitionStatus } from "react-transition-group"
import { Filter, FilterType, InputFilter, RankingsFilters, RankingsFiltersValues, SelectFilter, SelectFilterValue } from "./types"

const modalTransitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: { opacity: 1, display: 'flex' },
    entered: { opacity: 1, display: 'flex' },
    exiting: { opacity: 0, display: 'hidden' },
    exited: { opacity: 0, display: 'none' },
    unmounted: {}
}

const FilterValuesContext = createContext<RankingsFiltersValues>({})

function generateSelectFilterValues<valueType>(
    start: number,
    end: number,
    generator: (current: number) => SelectFilterValue<valueType>,
    increment: number = 1,
): SelectFilterValue<valueType>[] {
    const values: SelectFilterValue<valueType>[] = []
    for (let i = start; i < end; i+=increment) {
        values.push(generator(i))
    }
    return values
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
                queryBuilder.push(value == filter.defaultValue ? '' : `${key}=${value}`)
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
        const value = filterValues[key as keyof typeof filters]

        switch (filter.type) {
            case FilterType.SELECT: {
                const valueNumber = Number(value)
                const defaultValue = (filter as SelectFilter<number>).defaultValue
                const options = (filter as SelectFilter<number>).values
                const parsedValue = isNaN(valueNumber) ? defaultValue : valueNumber
                if (parsedValue != defaultValue) {
                    const name = options[parsedValue].name
                    activeFilters.push(<ActiveFilter name={langDict[name]} onClick={() => { filterValues.timePeriod = defaultValue; saveFilterValues() }} />)
                }
                break
            }
            case FilterType.INPUT: {
                const defaultValue = (filter as InputFilter).defaultValue
                if (value != defaultValue) {
                    activeFilters.push(<ActiveFilter name={String(value)} onClick={() => { saveFilterValues() }}></ActiveFilter>)
                }
            }
        }
    }

    // generate main filters
    const mainFilters: React.ReactNode[] = []
    {
        // generate year filter
        const currentValue = filterValues.year

        // options
        const defaultValue = 0
        const yearStart = 7
        const yearEnd = new Date().getFullYear() - 1999

        let currentOption = defaultValue
        const yearFilter = {
            name: 'filter_year',
            key: 'yearFilter',
            type: FilterType.SELECT,
            values: [
                { name: langDict['filter_year_any'] as LanguageDictionaryKey, value: '' },
                ...generateSelectFilterValues(yearStart, yearEnd, current => {
                    const year = current + 2000
                    const yearString = String(year)
                    if (yearString == currentValue) {
                        currentOption = yearEnd - (current)
                    }
                    return {
                        name: yearString as LanguageDictionaryKey,
                        value: year
                    }
                }).reverse()
            ],
            defaultValue: defaultValue
        } as SelectFilter<Number>

        mainFilters.push(<SelectFilterElement searchable name={langDict[yearFilter.name]} value={currentOption} defaultValue={defaultValue} options={yearFilter.values.map(value => value.name)} onValueChanged={newValue => {filterValues.year = String(yearFilter.values[newValue].value); saveFilterValues()}}></SelectFilterElement>)
    }

    return (
        <FilterValuesContext.Provider value={filterValues}>
            <ul className="flex flex-col gap-5 w-full mt-5">
                <li key='filters'><ul className="flex gap-5">
                    <SelectFilterElement name={langDict[filters.sourceType.name]} value={Number(filterValues.sourceType)} defaultValue={filters.sourceType.defaultValue} options={filters.sourceType.values.map(value => langDict[value.name])} onValueChanged={newValue => {filterValues.sourceType = newValue; saveFilterValues()}}></SelectFilterElement>
                    <SelectFilterElement name={langDict[filters.timePeriod.name]} value={Number(filterValues.timePeriod)} defaultValue={filters.timePeriod.defaultValue} options={filters.timePeriod.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.timePeriod = newValue; saveFilterValues() }} />
                    {mainFilters}
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
        name,
        value,
        defaultValue,
        options,
        searchable = false,
        onValueChanged
    }: {
        name: string
        value: number
        defaultValue: number,
        options: string[]
        searchable?: boolean 
        onValueChanged?: (newValue: number) => void
    }
) {
    value = isNaN(value) ? defaultValue : value
    const [modalOpen, setModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [inputFocused, setInputFocused] = useState(false)

    // parse filter value

    const modalRef = useRef<HTMLUListElement>(null)

    const valueIsDefault = value == defaultValue
    const valueName = options[value]

    const setValue = (newValue: number) => {
        if (value != newValue && onValueChanged) {
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
        <FilterElement key={name} name={name}>
            <div className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal cursor-pointer" onClick={() => setModalOpen(true)}>
                {searchable
                    ? <input type='search' onFocus={() => {setSearchQuery(''); setInputFocused(true) }} onBlur={() => setInputFocused(false)} onChange={(event) => { setSearchQuery(event.currentTarget.value.toLowerCase()) }} value={ inputFocused ? searchQuery : valueName} className={` cursor-text bg-transparent w-32 outline-none text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}/>
                    : <span className={`bg-transparent w-32 outline-none cursor-pointer text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'}`}>{valueName}</span>
                }
                {valueIsDefault ? <Icon icon='expand_more'></Icon> : <Icon icon='close'></Icon>}
            </div>
            {modalOpen && <div className="relative w-full h-0 transition-opacity z-10">
                <ul ref={modalRef} className="absolute top-2 left-0 w-full rounded-xl bg-surface-container-high shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip">
                    {options.map((value, index) => {
                        return searchable && value.toLowerCase().match(searchQuery) || !searchable ? (
                            <li key={index}>
                                <button key={index} onClick={() => { setValue(index);  }} className="w-full font-normal h-auto overflow-clip text-ellipsis p-2 rounded-xl relative transition-colors hover:bg-surface-container-highest">{value}</button>
                            </li>
                        ) : null
                    })}
                </ul>
            </div>}
        </FilterElement>
    )

}