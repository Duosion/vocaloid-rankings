'use client'
import { LanguageDictionary, LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { CheckboxFilter, Filter, FilterType, InputFilter, PopupAlignment, RankingsFilters, RankingsFiltersValues, SelectFilter, SelectFilterValue } from "./types"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { CheckboxFilterElement } from "@/components/filter/checkbox-filter"
import { ActiveFilter } from "@/components/filter/active-filter"
import { FadeInOut } from "@/components/transitions/fade-in-out"
import { InputFilterElement } from "@/components/filter/input-filter"
import { SelectFilterElement } from "@/components/filter/select-filter"
import { timeoutDebounce } from "@/lib/utils"
import { NumberInputFilterElement } from "@/components/filter/number-input-filter"
import { DateFilterElement } from "@/components/filter/date-filter"
import { Elevation } from "@/material/types"

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
                    <ul ref={modalRef} className={`absolute top-3 w-fit rounded-xl bg-surface-container shadow-md p-5 flex flex-col gap-3 ${alignment}`}>
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
                        activeFilters.push(<ActiveFilter name={`${langDict[filter.name]}: ${String(value)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }} />)
                    }
                    break
                }
                case FilterType.CHECKBOX: {
                    const defaultValue = (filter as CheckboxFilter).defaultValue
                    if (decodeBoolean(value as number) != defaultValue) {
                        activeFilters.push(<ActiveFilter name={langDict[filter.name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }} />)
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

        mainFilters.push(<InputFilterElement icon='search' name={langDict[searchFilter.name]} value={filterValues.search || ''} placeholder={langDict[searchFilter.placeholder]} defaultValue={searchFilter.defaultValue} onValueChanged={(newValue) => {
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
    // artist type
    {
        const artistType = filters.artistType
        mainFilters.push(<SelectFilterElement searchable name={langDict[artistType.name]} value={Number(filterValues.artistType)} defaultValue={artistType.defaultValue} options={artistType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.artistType = newValue; saveFilterValues() }} />)
    }

    // publish date filter
    const publishDateFilters: React.ReactNode[] = []
    {
        // generate year filter
        const currentYear = filterValues.publishYear
        const currentMonth = filterValues.publishMonth
        const currentDay = filterValues.publishDay

        // options
        const yearDefaultValue = 0
        const monthDefaultValue = 0
        const dayDefaultValue = 0

        const yearStart = 7
        const yearEnd = new Date().getFullYear() - 1999

        const monthStart = 1
        const monthEnd = 13

        const dayStart = 1
        const dayEnd = 32

        // year
        let currentYearOption = yearDefaultValue
        const publishYear = filters.publishYear
        const yearFilter = {
            name: publishYear.name,
            key: publishYear.key,
            displayActive: publishYear.displayActive,
            type: FilterType.SELECT,
            values: [
                { name: langDict['filter_year_any'] as LanguageDictionaryKey, value: '' },
                ...generateSelectFilterValues(yearStart, yearEnd, current => {
                    const year = current + 2000
                    const yearString = String(year)
                    if (yearString == currentYear) currentYearOption = yearEnd - (current)
                    return {
                        name: yearString as LanguageDictionaryKey,
                        value: year
                    }
                }).reverse()
            ],
            defaultValue: yearDefaultValue
        } as SelectFilter<Number>

        // month
        let currentMonthOption = monthDefaultValue
        const publishMonth = filters.publishMonth
        const monthFilter = {
            name: publishMonth.name,
            key: publishMonth.key,
            displayActive: publishMonth.displayActive,
            type: FilterType.SELECT,
            values: [
                { name: langDict['filter_year_any'] as LanguageDictionaryKey, value: '' },
                ...generateSelectFilterValues(monthStart, monthEnd, current => {
                    const monthString = String(current)
                    if (monthString == currentMonth) currentMonthOption = current
                    return {
                        name: monthString as LanguageDictionaryKey,
                        value: current
                    }
                })
            ],
            defaultValue: monthDefaultValue
        } as SelectFilter<Number>

        // day
        let currentDayOption = dayDefaultValue
        const publishDay = filters.publishDay
        const dayFilter = {
            name: publishDay.name,
            key: publishDay.key,
            displayActive: publishDay.displayActive,
            type: FilterType.SELECT,
            values: [
                { name: langDict['filter_year_any'] as LanguageDictionaryKey, value: '' },
                ...generateSelectFilterValues(dayStart, dayEnd, current => {
                    const dayString = String(current)
                    if (dayString == currentDay) currentDayOption = current
                    return {
                        name: dayString as LanguageDictionaryKey,
                        value: current
                    }
                })
            ],
            defaultValue: dayDefaultValue
        } as SelectFilter<Number>

        // push filters to the table
        publishDateFilters.push(<SelectFilterElement searchable elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[yearFilter.name]} value={currentYearOption} defaultValue={yearDefaultValue} options={yearFilter.values.map(value => value.name)} onValueChanged={newValue => { filterValues.publishYear = String(yearFilter.values[newValue].value); saveFilterValues() }} />)
        publishDateFilters.push(<SelectFilterElement searchable elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[monthFilter.name]} value={currentMonthOption} defaultValue={monthDefaultValue} options={monthFilter.values.map(value => value.name)} onValueChanged={newValue => { filterValues.publishMonth = String(monthFilter.values[newValue].value); saveFilterValues() }} />)
        publishDateFilters.push(<SelectFilterElement searchable elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[dayFilter.name]} value={currentDayOption} defaultValue={dayDefaultValue} options={dayFilter.values.map(value => value.name)} onValueChanged={newValue => { filterValues.publishDay = String(dayFilter.values[newValue].value); saveFilterValues() }} />)
    }

    // pop up filters

    // min & max views
    const viewsFilters: React.ReactNode[] = []
    {
        const minViewsFilter = filters.minViews
        const maxViewsFilter = filters.maxViews

        const minViewsTimeout = useRef<NodeJS.Timeout>()
        const maxViewsTimeout = useRef<NodeJS.Timeout>()

        viewsFilters.push(<NumberInputFilterElement elevation={Elevation.HIGH} name={langDict[minViewsFilter.name]} value={filterValues.minViews || minViewsFilter.defaultValue} placeholder={langDict[minViewsFilter.placeholder]} defaultValue={minViewsFilter.defaultValue} onValueChanged={(newValue) => {
            filterValues.minViews = newValue;
            saveFilterValues(false)

            timeoutDebounce(minViewsTimeout, 500, saveFilterValues)
        }} />)
        viewsFilters.push(<NumberInputFilterElement elevation={Elevation.HIGH} name={langDict[maxViewsFilter.name]} value={filterValues.maxViews || maxViewsFilter.defaultValue} placeholder={langDict[maxViewsFilter.placeholder]} defaultValue={maxViewsFilter.defaultValue} onValueChanged={(newValue) => {
            filterValues.maxViews = newValue;
            saveFilterValues(false)

            timeoutDebounce(maxViewsTimeout, 500, saveFilterValues)
        }} />)
    }

    return (
        <ul className="flex flex-col gap-5 w-full mt-5">
            <li key='filters' className="flex gap-5 items-end">
                <ul className="flex gap-5 flex-1">
                    {mainFilters}
                </ul>
                <PopupIconButton icon='tune' align={PopupAlignment.RIGHT}>
                    <li><ul className="flex flex-row gap-5">
                        <SelectFilterElement elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[filters.songType.name]} value={Number(filterValues.songType)} defaultValue={filters.songType.defaultValue} options={filters.songType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.songType = newValue; saveFilterValues() }} />
                        {viewsFilters}
                    </ul></li>
                    <li><ul className="flex flex-row gap-5">{publishDateFilters}</ul></li>
                    <li><ul className="flex flex-row gap-5 items-center">
                        <DateFilterElement elevation={Elevation.HIGH} name={langDict[filters.timestamp.name]} value={filterValues.timestamp || currentTimestamp} max={currentTimestamp} onValueChanged={newValue => { filterValues.timestamp = newValue; saveFilterValues() }} />
                        <CheckboxFilterElement name={langDict[filters.singleVideo.name]} value={decodeBoolean(filterValues.singleVideo)} onValueChanged={(newValue) => { filterValues.singleVideo = encodeBoolean(newValue); saveFilterValues() }} />
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
    )
}