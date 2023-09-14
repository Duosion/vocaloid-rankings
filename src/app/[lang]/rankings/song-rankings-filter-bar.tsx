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
import { NumberSelectFilterElement } from "@/components/filter/number-select-filter"

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

    // timeouts
    const searchTimeout = useRef<NodeJS.Timeout>()
    const minViewsTimeout = useRef<NodeJS.Timeout>()
    const maxViewsTimeout = useRef<NodeJS.Timeout>()

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

    return (
        <ul className="flex flex-col gap-5 w-full mt-5">
            <li className="flex gap-5 items-end">
                <ul className="flex gap-5 flex-1">
                    {/* Search */}
                    <InputFilterElement icon='search' name={langDict[filters.search.name]} value={filterValues.search || ''} placeholder={langDict[filters.search.placeholder]} defaultValue={filters.search.defaultValue} onValueChanged={(newValue) => {
                        filterValues.search = newValue
                        saveFilterValues(false)

                        timeoutDebounce(searchTimeout, 500, saveFilterValues)
                    }} />
                    {/* Source Type */}
                    <SelectFilterElement name={langDict[filters.sourceType.name]} value={Number(filterValues.sourceType)} defaultValue={filters.sourceType.defaultValue} options={filters.sourceType.values.map(value => langDict[value.name])} onValueChanged={newValue => { filterValues.sourceType = newValue; saveFilterValues() }} />
                    {/* Time Period */}
                    <SelectFilterElement name={langDict[filters.timePeriod.name]} value={Number(filterValues.timePeriod)} defaultValue={filters.timePeriod.defaultValue} options={filters.timePeriod.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.timePeriod = newValue; saveFilterValues() }} />
                    {/* Artist Type */}
                    <SelectFilterElement searchable name={langDict[filters.artistType.name]} value={Number(filterValues.artistType)} defaultValue={filters.artistType.defaultValue} options={filters.artistType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.artistType = newValue; saveFilterValues() }} />
                </ul>
                <PopupIconButton icon='tune' align={PopupAlignment.RIGHT}>
                    <li key='popup-row-1'><ul className="flex flex-row gap-5">
                        {/* Song Type */}
                        <SelectFilterElement elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[filters.songType.name]} value={Number(filterValues.songType)} defaultValue={filters.songType.defaultValue} options={filters.songType.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.songType = newValue; saveFilterValues() }} />
                        {/* Minimum Views*/}
                        <NumberInputFilterElement elevation={Elevation.HIGH} name={langDict[filters.minViews.name]} value={filterValues.minViews || filters.minViews.defaultValue} placeholder={langDict[filters.minViews.placeholder]} defaultValue={filters.minViews.defaultValue} onValueChanged={(newValue) => {
                            filterValues.minViews = newValue;
                            saveFilterValues(false)

                            timeoutDebounce(minViewsTimeout, 500, saveFilterValues)
                        }} />
                        {/* Maximum Views */}
                        <NumberInputFilterElement elevation={Elevation.HIGH} name={langDict[filters.maxViews.name]} value={filterValues.maxViews || filters.maxViews.defaultValue} placeholder={langDict[filters.maxViews.placeholder]} defaultValue={filters.maxViews.defaultValue} onValueChanged={(newValue) => {
                            filterValues.maxViews = newValue;
                            saveFilterValues(false)

                            timeoutDebounce(maxViewsTimeout, 500, saveFilterValues)
                        }} />
                    </ul></li>
                    <li key='popup-row-2'><ul className="flex flex-row gap-5">
                        {/* Publish Year */}
                        <NumberSelectFilterElement reverse elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[filters.publishYear.name]} value={Number(filterValues.publishYear)} defaultValue={0} start={2007} end={new Date().getFullYear() + 1} onValueChanged={newValue => { filterValues.publishYear = String(newValue); saveFilterValues() }} />
                        {/* Publish Month */}
                        <NumberSelectFilterElement elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[filters.publishMonth.name]} value={Number(filterValues.publishMonth)} defaultValue={0} start={1} end={13} onValueChanged={newValue => { filterValues.publishMonth = String(newValue); saveFilterValues() }} />
                        {/* Publish Day */}
                        <NumberSelectFilterElement elevation={Elevation.HIGH} modalElevation={Elevation.HIGHEST} name={langDict[filters.publishDay.name]} value={Number(filterValues.publishYear)} defaultValue={0} start={1} end={32} onValueChanged={newValue => { filterValues.publishDay = String(newValue); saveFilterValues() }} />
                    </ul></li>
                    <li key='popup-row-3'><ul className="flex flex-row gap-5 items-center">
                        {/* Timestamp */}
                        <DateFilterElement elevation={Elevation.HIGH} name={langDict[filters.timestamp.name]} value={filterValues.timestamp || currentTimestamp} max={currentTimestamp} onValueChanged={newValue => { filterValues.timestamp = newValue; saveFilterValues() }} />
                        {/* Single Video Mode */}
                        <CheckboxFilterElement name={langDict[filters.singleVideo.name]} value={decodeBoolean(filterValues.singleVideo)} onValueChanged={(newValue) => { filterValues.singleVideo = encodeBoolean(newValue); saveFilterValues() }} />
                    </ul></li>
                </PopupIconButton>
            </li>
            <li><ul className="flex gap-5 items-center justify-end">
                {/* Active Filters */}
                {activeFilters.length > 0 &&
                    <li key='activeFilters' className="flex-1"><ul className="flex gap-3">
                        {activeFilters}
                    </ul></li>
                }
                {/* Order By */}
                <SelectFilterElement minimal icon='sort' clearIcon="sort" name={langDict[filters.orderBy.name]} value={Number(filterValues.orderBy)} defaultValue={filters.orderBy.defaultValue} options={filters.orderBy.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.orderBy = newValue; saveFilterValues() }} />
            </ul></li>
        </ul>
    )
}