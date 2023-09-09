'use client'

import { FilledIconButton, Icon } from "@/components/material"
import { LanguageDictionary, LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { CSSProperties, MutableRefObject, createContext, useEffect, useRef, useState } from "react"
import { TransitionStatus } from "react-transition-group"
import { CheckboxFilter, Filter, FilterType, InputFilter, PopupAlignment, RankingsFilters, RankingsFiltersValues, SelectFilter, SelectFilterValue } from "./types"

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
    for (let i = start; i < end; i += increment) {
        values.push(generator(i))
    }
    return values
}

function timeoutDebounce(
    ref: MutableRefObject<NodeJS.Timeout | undefined>,
    timeout: number,
    callback: () => void
) {
    if (ref) {
        clearTimeout(ref.current)
    }

    ref.current = setTimeout(callback, timeout)
}

function encodeBoolean(
    bool: boolean
): number {
    return bool ? 1 : 0
}

function decodeBoolean(
    num?: number
): boolean {
    return num == 1
}

function FilterElement(
    {
        name,
        children,
        minimal = false
    }: {
        name: string,
        children?: React.ReactNode
        minimal?: boolean
    }
) {
    return (
        <li key={name} className="w-fit h-fit flex flex-col font-bold">
            {!minimal ? <h3 className="text-on-background text-lg mb-2">{name}</h3> : undefined}
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

function FadeInOut(
    {
        visible = false,
        duration = 150,
        children
    }: {
        visible?: boolean,
        duration?: number
        children?: React.ReactNode
    }
) {
    const [isVisible, setIsVisible] = useState(visible)
    const [transitioning, setTransitioning] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        if (!visible) {
            setTransitioning(true)
            timeoutDebounce(timeoutRef, duration, () => setTransitioning(false))
        }
        setIsVisible(visible)
    }, [visible])

    return (
        <div className="transition-opacity" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0px)' : 'translateY(3px)', transitionDuration: `${duration}ms`, transitionProperty: 'opacity, transform' }}>
            {isVisible || transitioning ? children : undefined}
        </div>
    )

}

function PopupIconButton(
    {
        icon,
        align,
        children
    }: {
        icon: string,
        align: PopupAlignment,
        children?: React.ReactNode
    }
) {
    const [modalOpen, setModalOpen] = useState(false)
    const modalRef = useRef<HTMLUListElement>(null)

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (!event.defaultPrevented && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setModalOpen(false)
            }
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [modalOpen])

    const alignment = align == PopupAlignment.LEFT ? 'left-0' : align == PopupAlignment.RIGHT ? 'right-0' : 'right-0 left-0'
    return (
        <ul className="flex flex-col">
            <FilledIconButton icon={icon} onClick={_ => setModalOpen(true)} />
            <FadeInOut visible={modalOpen}>
                <div className="relative w-full h-0 z-10">
                    <ul ref={modalRef} className={`absolute top-3 w-fit rounded-xl bg-surface-container-high shadow-md p-5 flex flex-col gap-3 ${alignment}`}>
                        {children}
                    </ul>
                </div>
            </FadeInOut>
        </ul>
    )
}

export function SongRankingsFilterBar(
    {
        href,
        filters,
        langDict,
        values,
        currentTimestamp
    }: {
        href: string
        filters: RankingsFilters
        langDict: LanguageDictionary
        values: RankingsFiltersValues
        currentTimestamp: string
    }
) {
    const router = useRouter()

    const [filterValues, setFilterValues] = useState(values)

    function saveFilterValues(route: boolean = true) {
        setFilterValues({ ...filterValues })
        // set url
        if (route) {
            const queryBuilder = []
            for (const key in filterValues) {
                const value = filterValues[key as keyof typeof filterValues]
                const filter = filters[key as keyof typeof filters]
                if (value && filter) {
                    queryBuilder.push(value == filter.defaultValue ? '' : `${key}=${value}`)
                }
            }
            router.push(`${href}?${queryBuilder.join('&')}`)
        }
    }

    // build active filters
    const activeFilters: React.ReactNode[] = []
    for (const key in filterValues) {
        let filter = filters[key as keyof typeof filters] as Filter
        const value = filterValues[key as keyof typeof filterValues]

        if (filter.displayActive) {
            switch (filter.type) {
                case FilterType.SELECT: {
                    const valueNumber = Number(value)
                    const defaultValue = (filter as SelectFilter<number>).defaultValue
                    const options = (filter as SelectFilter<number>).values
                    const parsedValue = isNaN(valueNumber) ? defaultValue : valueNumber
                    if (parsedValue != defaultValue) {
                        const name = options[parsedValue].name
                        activeFilters.push(<ActiveFilter name={langDict[name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }} />)
                    }
                    break
                }
                case FilterType.INPUT: {
                    const defaultValue = (filter as InputFilter).defaultValue
                    if (value != defaultValue) {
                        activeFilters.push(<ActiveFilter name={`${langDict[filter.name]}: ${String(value)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }}/>)
                    }
                    break
                }
                case FilterType.CHECKBOX: {
                    const defaultValue = (filter as CheckboxFilter).defaultValue
                    if (decodeBoolean(value as number) != defaultValue) {
                        activeFilters.push(<ActiveFilter name={langDict[filter.name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }}/>)
                    }
                    break
                }
            }
        }
    }

    // generate main filters
    const mainFilters: React.ReactNode[] = []

    // search
    {
        const searchFilter = filters.search
        const timeout = useRef<NodeJS.Timeout>()

        mainFilters.push(<InputFilterElement name={langDict[searchFilter.name]} value={filterValues.search || ''} placeholder={langDict[searchFilter.placeholder]} defaultValue={searchFilter.defaultValue} onValueChanged={(newValue) => {
            filterValues.search = newValue
            saveFilterValues(false)

            timeoutDebounce(timeout, 500, saveFilterValues)
        }} />)
    }
    // source type
    {
        const sourceType = filters.sourceType
        mainFilters.push(<SelectFilterElement name={langDict[sourceType.name]} value={Number(filterValues.sourceType)} defaultValue={sourceType.defaultValue} options={sourceType.values.map(value => langDict[value.name])} onValueChanged={newValue => { filterValues.sourceType = newValue; saveFilterValues() }} />)
    }
    // time period
    {
        const timePeriod = filters.timePeriod
        mainFilters.push(<SelectFilterElement name={langDict[timePeriod.name]} value={Number(filterValues.timePeriod)} defaultValue={timePeriod.defaultValue} options={timePeriod.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.timePeriod = newValue; saveFilterValues() }} />)
    }
    // year
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
            displayActive: true,
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

        mainFilters.push(<SelectFilterElement searchable name={langDict[yearFilter.name]} value={currentOption} defaultValue={defaultValue} options={yearFilter.values.map(value => value.name)} onValueChanged={newValue => { filterValues.year = String(yearFilter.values[newValue].value); saveFilterValues() }} />)
    }
    // artist type
    {
        const artistType = filters.artistType
        mainFilters.push(<SelectFilterElement searchable name={langDict[artistType.name]} value={Number(filterValues.artistType)} defaultValue={artistType.defaultValue} options={artistType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.artistType = newValue; saveFilterValues() }} />)
    }

    // pop up filters

    // min & max views
    const viewsFilters: React.ReactNode[] = []
    {
        const minViewsFilter = filters.minViews
        const maxViewsFilter = filters.maxViews

        const minViewsTimeout = useRef<NodeJS.Timeout>()
        const maxViewsTimeout = useRef<NodeJS.Timeout>()

        viewsFilters.push(<NumberInputFilterElement name={langDict[minViewsFilter.name]} value={filterValues.minViews || minViewsFilter.defaultValue} placeholder={langDict[minViewsFilter.placeholder]} defaultValue={minViewsFilter.defaultValue} onValueChanged={(newValue) => {
            filterValues.minViews = newValue;
            saveFilterValues(false)

            timeoutDebounce(minViewsTimeout, 500, saveFilterValues)
        }} />)
        viewsFilters.push(<NumberInputFilterElement name={langDict[maxViewsFilter.name]} value={filterValues.maxViews || maxViewsFilter.defaultValue} placeholder={langDict[maxViewsFilter.placeholder]} defaultValue={maxViewsFilter.defaultValue} onValueChanged={(newValue) => {
            filterValues.maxViews = newValue;
            saveFilterValues(false)

            timeoutDebounce(maxViewsTimeout, 500, saveFilterValues)
        }} />)
    }

    return (
        <FilterValuesContext.Provider value={filterValues}>
            <ul className="flex flex-col gap-5 w-full mt-5">
                <li key='filters' className="flex gap-5 items-end">
                    <ul className="flex gap-5 flex-1">
                        {mainFilters}
                    </ul>
                    <PopupIconButton icon='tune' align={PopupAlignment.RIGHT}>
                        <li><ul className="flex flex-row gap-5">
                            <SelectFilterElement name={langDict[filters.songType.name]} value={Number(filterValues.songType)} defaultValue={filters.songType.defaultValue} options={filters.songType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.songType = newValue; saveFilterValues() }} />
                            {viewsFilters}
                        </ul></li>
                        <li><ul className="flex flex-row gap-5 items-center">
                            <DateFilterElement name={langDict[filters.timestamp.name]} value={filterValues.timestamp || currentTimestamp} max={currentTimestamp} onValueChanged={newValue => { filterValues.timestamp = newValue; saveFilterValues() }}/>
                            <CheckboxFilterElement name={langDict[filters.singleVideo.name]} value={decodeBoolean(filterValues.singleVideo)} onValueChanged={(newValue) => { filterValues.singleVideo = encodeBoolean(newValue); saveFilterValues() }}/>
                        </ul></li>
                    </PopupIconButton>
                </li>
                <li><ul className="flex gap-5 items-center justify-end">
                    {activeFilters.length > 0 &&
                        <li key='activeFilters' className="flex-1"><ul className="flex gap-3">
                            {activeFilters}
                        </ul></li>
                    }
                    <SelectFilterElement minimal icon='sort' clearIcon="sort" name={langDict[filters.orderBy.name]} value={Number(filterValues.orderBy)} defaultValue={filters.orderBy.defaultValue} options={filters.orderBy.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.orderBy = newValue; saveFilterValues() }} />
                </ul></li>
            </ul>
        </FilterValuesContext.Provider>
    )
}

export function CheckboxFilterElement(
    {
        name,
        value,
        onValueChanged
    } : {
        name: string
        value: boolean
        onValueChanged?: (newValue: boolean) => void
    }
) {
    function setValue(newValue: boolean) {
        if (value != newValue && onValueChanged) onValueChanged(newValue)
    }

    return (
        <section className="flex gap-3 items-center">
            <input id={name} type='checkbox' checked={value} onChange={newValue => setValue(newValue.currentTarget.checked)}/>
            <label htmlFor={name} className="text-lg text-on-background font-normal">{name}</label>
        </section>
    )
}

export function DateFilterElement(
    {
        name,
        value,
        min,
        max,
        onValueChanged
    }: {
        name: string
        value: string
        min?: string
        max?: string
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <search className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal">
                <input type='date' value={value} min={min} max={max} onChange={event => setValue(event.currentTarget.value)} className={`cursor-text bg-transparent min-w-fit w-32 outline-none text-left`} />
            </search>
        </FilterElement>
    )
}

export function InputFilterElement(
    {
        name,
        value,
        placeholder,
        defaultValue,
        onValueChanged
    }: {
        name: string
        value: string
        placeholder: string
        defaultValue: string
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <search className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal">
                <Icon icon='search' />
                <input type='search' placeholder={placeholder} onClick={e => e.preventDefault()} onChange={event => setValue(event.currentTarget.value)} value={value} className={`cursor-text bg-transparent w-32 outline-none text-left`} />
                {value != defaultValue && <Icon icon='close'></Icon>}
            </search>
        </FilterElement>
    )
}

export function NumberInputFilterElement(
    {
        name,
        value,
        placeholder,
        defaultValue,
        onValueChanged
    }: {
        name: string
        value: string
        placeholder: string
        defaultValue: string
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        const asNumber = Number(newValue)
        if (!isNaN(asNumber) && value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <search className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={e => e.preventDefault()}>
                <input type='search' placeholder={placeholder} onChange={event => setValue(event.currentTarget.value)} value={value} className={`cursor-text bg-transparent w-32 outline-none text-left`} />
                {value != defaultValue && <Icon icon='close'></Icon>}
            </search>
        </FilterElement>
    )
}

export function SelectFilterElement(
    {
        name,
        value,
        defaultValue,
        options,
        searchable = false,
        minimal = false,
        icon = 'expand_more',
        clearIcon = 'close',
        onValueChanged
    }: {
        name: string
        value: number
        defaultValue: number
        options: string[]
        searchable?: boolean
        minimal?: boolean
        icon?: string
        clearIcon?: string
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
        <FilterElement key={name} name={name} minimal={minimal}>
            <search className={minimal ? 'text-on-background py-0.5 gap-3 w-fit flex justify-end items-center text-lg font-normal cursor-pointer' : "py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal cursor-pointer"} onClick={() => setModalOpen(true)}>
                {searchable
                    ? <input type='search' onFocus={() => { setSearchQuery(''); setInputFocused(true) }} onBlur={() => setInputFocused(false)} onChange={(event) => { setSearchQuery(event.currentTarget.value.toLowerCase()) }} value={inputFocused ? searchQuery : valueName} className={`cursor-text bg-transparent outline-none text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'} ${minimal ? 'w-fit' : 'w-32'}`} />
                    : <span className={`bg-transparent outline-none cursor-pointer text-left ${valueIsDefault ? 'text-on-surface-variant' : 'text-primary'} ${minimal ? 'w-fit' : 'w-32'}`}>{valueName}</span>
                }
                {valueIsDefault ? <Icon icon={icon}></Icon> : <Icon icon={clearIcon}></Icon>}
            </search>
            <FadeInOut visible={modalOpen}>
                <div className="relative min-w-fit w-full h-0 z-20">
                    <ul ref={modalRef} className="absolute top-2 min-w-[160px] w-full right-0 rounded-xl bg-surface-container-high shadow-md p-2 max-h-72 overflow-y-scroll overflow-x-clip ">
                        {options.map((value, index) => {
                            return searchable && value.toLowerCase().match(searchQuery) || !searchable ? (
                                <li key={index}>
                                    <button key={index} onClick={(e) => { e.preventDefault(); setValue(index); }} className="w-full font-normal h-auto overflow-clip text-ellipsis p-2 rounded-xl relative transition-colors hover:bg-surface-container-highest">{value}</button>
                                </li>
                            ) : null
                        })}
                    </ul>
                </div>
            </FadeInOut>
        </FilterElement>
    )

}