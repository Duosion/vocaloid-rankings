'use client'
import { LanguageDictionary, LanguageDictionaryKey } from "@/localization"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { CheckboxFilter, Filter, FilterType, InputFilter, PopupAlignment, RankingsFilters, SongRankingsFiltersValues, SelectFilter, SelectFilterValue, SongRankingsFilterBarValues, MultiFilter } from "./types"
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
import { ToggleGroupFilterElement } from "@/components/filter/toggle-group-filter"
import { MultiSelectFilterElement } from "@/components/filter/multi-select-filter"
import { ExpansionPanel } from "@/components/transitions/expansion-panel"

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

function encodeMultiFilter(
    values: number[],
    separator: string = ','
): string {
    const builder = []
    for (const value of values) {
        if (!isNaN(value)) builder.push(value)
    }
    return builder.join(separator)
}

function decodeMultiFilter(
    input?: string,
    separator: string = ','
): number[] {
    const output: number[] = []

    input?.split(separator).map(rawValue => {
        const parsed = Number(rawValue)
        if (!isNaN(parsed)) {
            output.push(parsed)
        }
    })

    return output
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
        <ul className="flex flex-col z-20">
            <FilledIconButton icon={icon} onClick={_ => setModalOpen(true)} />
            <FadeInOut visible={modalOpen}>
                <div className="relative w-full h-0">
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
        values: SongRankingsFiltersValues
        currentTimestamp: string
    }
) {
    const router = useRouter()

    const [filterValues, setFilterValues] = useState({
        search: values.search,
        timePeriod: values.timePeriod,
        publishYear: values.publishYear,
        publishMonth: values.publishMonth,
        publishDay: values.publishDay,
        includeSourceTypes: decodeMultiFilter(values.includeSourceTypes),
        excludeSourceTypes: decodeMultiFilter(values.excludeSourceTypes),
        includeSongTypes: decodeMultiFilter(values.includeSongTypes),
        excludeSongTypes: decodeMultiFilter(values.excludeSongTypes),
        includeArtistTypes: decodeMultiFilter(values.includeArtistTypes),
        excludeArtistTypes: decodeMultiFilter(values.excludeArtistTypes),
        minViews: values.minViews,
        maxViews: values.maxViews,
        orderBy: values.orderBy,
        timestamp: values.timestamp,
        singleVideo: decodeBoolean(Number(values.singleVideo))
    } as SongRankingsFilterBarValues)

    // timeouts
    const searchTimeout = useRef<NodeJS.Timeout>()
    const minViewsTimeout = useRef<NodeJS.Timeout>()
    const maxViewsTimeout = useRef<NodeJS.Timeout>()

    // options
    const sourceTypesOptions = filters.includeSourceTypes.values.map(value => langDict[value.name])
    const songTypesOptions = filters.includeSongTypes.values.map(value => langDict[value.name])
    const artistTypesOptions = filters.includeArtistTypes.values.map(value => langDict[value.name])

    function saveFilterValues(route: boolean = true) {
        setFilterValues({ ...filterValues })
        // set url
        if (route) {
            const queryBuilder = []
            for (const key in filterValues) {
                const value = filterValues[key as keyof typeof filterValues]
                const filter = filters[key as keyof typeof filters]
                if (value && filter) {
                    switch (filter.type) {
                        case FilterType.SELECT:
                        case FilterType.INPUT:
                            if (value != (filter as InputFilter).defaultValue) queryBuilder.push(`${key}=${value}`)
                            break
                        case FilterType.CHECKBOX:
                            if (value) queryBuilder.push(`${key}=${encodeBoolean(value as boolean)}`)
                            break
                        case FilterType.MULTI:
                            const encoded = encodeMultiFilter(value as number[])
                            if (encoded != '') queryBuilder.push(`${key}=${encoded}`)
                            break
                    }

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

        if (filter && filter.displayActive) {
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
                    if (value && value != defaultValue) {
                        activeFilters.push(<ActiveFilter name={`${langDict[filter.name]}: ${String(value)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }} />)
                    }
                    break
                }
                case FilterType.CHECKBOX: {
                    const defaultValue = (filter as CheckboxFilter).defaultValue
                    if (value as boolean != defaultValue) {
                        activeFilters.push(<ActiveFilter name={langDict[filter.name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; saveFilterValues() }} />)
                    }
                    break
                }
                case FilterType.MULTI: {
                    const options = (filter as MultiFilter<number>).values
                    const parsedValue = value as number[]
                    if (parsedValue.length > 0) {
                        parsedValue.forEach(val => {
                            if (!isNaN(val)) {
                                activeFilters.push(<ActiveFilter name={`${langDict[filter.name]}: ${langDict[options[val].name]}`} onClick={() => {
                                    parsedValue.splice(parsedValue.indexOf(val), 1)
                                    filterValues[key as keyof typeof filterValues] = [...parsedValue] as any
                                    saveFilterValues()
                                }} />)
                            }
                        })
                    }

                }
            }
        }
    }

    return (
        <ul className="flex flex-col gap-5 w-full mt-5 z-10">
            <li className="flex gap-5 items-end">
                <ul className="flex gap-5 flex-1">
                    {/* Search */}
                    <InputFilterElement
                        icon='search'
                        name={langDict[filters.search.name]}
                        value={filterValues.search || ''}
                        placeholder={langDict[filters.search.placeholder]}
                        defaultValue={filters.search.defaultValue}
                        onValueChanged={(newValue) => {
                            filterValues.search = newValue
                            saveFilterValues(false)

                            timeoutDebounce(searchTimeout, 500, saveFilterValues)
                        }}
                    />
                    {/* Source Type */}
                    <MultiSelectFilterElement
                        name={langDict[filters.includeSourceTypes.name]}
                        value={filterValues.includeSourceTypes || []}
                        placeholder={langDict['filter_view_type_combined']}
                        options={sourceTypesOptions}
                        onValueChanged={newValue => {
                            filterValues.includeSourceTypes = [...newValue]
                            saveFilterValues()
                        }}
                    />
                    {/* Song Type */}
                    <MultiSelectFilterElement
                        name={langDict[filters.includeSongTypes.name]}
                        value={filterValues.includeSongTypes || []}
                        placeholder={langDict['filter_song_type_all']}
                        options={songTypesOptions}
                        onValueChanged={newValue => {
                            filterValues.includeSongTypes = [...newValue]
                            saveFilterValues()
                        }}
                    />
                    {/* Artist Type */}
                    <MultiSelectFilterElement
                        searchable
                        name={langDict[filters.includeArtistTypes.name]}
                        value={filterValues.includeArtistTypes || []}
                        placeholder={langDict['filter_artist_type_all']}
                        options={artistTypesOptions}
                        onValueChanged={newValue => {
                            filterValues.includeArtistTypes = [...newValue]
                            saveFilterValues()
                        }}
                    />
                </ul>
                <PopupIconButton icon='tune' align={PopupAlignment.RIGHT}>
                    <li key='popup-row-0'><ul className="flex flex-row gap-5">
                        {/* Time Period */}
                        <SelectFilterElement
                            name={langDict[filters.timePeriod.name]}
                            value={Number(filterValues.timePeriod)}
                            defaultValue={filters.timePeriod.defaultValue}
                            options={filters.timePeriod.values.map(value => langDict[value.name])}
                            elevation={Elevation.HIGH}
                            modalElevation={Elevation.HIGHEST}
                            onValueChanged={(newValue) => {
                                filterValues.timePeriod = newValue
                                saveFilterValues()
                            }}
                        />
                        {/* Custom Time Period Offset: From */}
                        <DateFilterElement
                            elevation={Elevation.HIGH}
                            name={langDict[filters.timestamp.name]}
                            value={filterValues.timestamp || currentTimestamp}
                            max={currentTimestamp}
                            onValueChanged={newValue => {
                                filterValues.timestamp = newValue
                                saveFilterValues()
                            }}
                        />
                        {/* Custom Time Period Offset: To */}
                        <DateFilterElement
                            elevation={Elevation.HIGH}
                            name={langDict[filters.timestamp.name]}
                            value={filterValues.timestamp || currentTimestamp}
                            max={currentTimestamp}
                            onValueChanged={newValue => {
                                filterValues.timestamp = newValue
                                saveFilterValues()
                            }}
                        />
                    </ul></li>
                    <li key='popup-row-1'><ul className="flex flex-row gap-5">
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
                        <NumberSelectFilterElement
                            reverse
                            elevation={Elevation.HIGH}
                            modalElevation={Elevation.HIGHEST}
                            name={langDict[filters.publishYear.name]}
                            placeholder={langDict[filters.publishYear.placeholder]}
                            value={Number(filterValues.publishYear)}
                            defaultValue={0}
                            start={2007}
                            end={new Date().getFullYear() + 1}
                            onValueChanged={newValue => {
                                filterValues.publishYear = newValue == undefined ? undefined : String(newValue)
                                saveFilterValues()
                            }}
                        />
                        {/* Publish Month */}
                        <NumberSelectFilterElement
                            elevation={Elevation.HIGH}
                            modalElevation={Elevation.HIGHEST}
                            name={langDict[filters.publishMonth.name]}
                            placeholder={langDict[filters.publishMonth.placeholder]}
                            value={Number(filterValues.publishMonth)}
                            defaultValue={0}
                            start={1}
                            end={13}
                            onValueChanged={newValue => {
                                filterValues.publishMonth = newValue == undefined ? undefined : String(newValue)
                                saveFilterValues()
                            }}
                        />
                        {/* Publish Day */}
                        <NumberSelectFilterElement
                            elevation={Elevation.HIGH}
                            modalElevation={Elevation.HIGHEST}
                            name={langDict[filters.publishDay.name]}
                            placeholder={langDict[filters.publishDay.placeholder]}
                            value={Number(filterValues.publishYear)}
                            defaultValue={0}
                            start={1}
                            end={32}
                            onValueChanged={newValue => {
                                filterValues.publishDay = newValue == undefined ? undefined : String(newValue)
                                saveFilterValues()
                            }}
                        />
                    </ul></li>
                    <li key='popup-row-3'><ul className="flex flex-row gap-5 items-center">
                        {/* Timestamp */}
                        <DateFilterElement elevation={Elevation.HIGH} name={langDict[filters.timestamp.name]} value={filterValues.timestamp || currentTimestamp} max={currentTimestamp} onValueChanged={newValue => { filterValues.timestamp = newValue; saveFilterValues() }} />
                        {/* Single Video Mode */}
                        <CheckboxFilterElement name={langDict[filters.singleVideo.name]} value={filterValues.singleVideo || filters.singleVideo.defaultValue} onValueChanged={(newValue) => { filterValues.singleVideo = newValue; saveFilterValues() }} />
                    </ul></li>
                    <li key='popup-row-4' className="flex flex-col gap-5">
                        <ExpansionPanel label='Advanced Filters'>
                            {/* Source Type */}
                            <ToggleGroupFilterElement name={langDict['filter_view_type']} included={filterValues.includeSourceTypes || []} excluded={filterValues.excludeSourceTypes || []} options={sourceTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                                filterValues.includeSourceTypes = [...newIncluded]
                                filterValues.excludeSourceTypes = [...newExcluded]
                                saveFilterValues()
                            }} />
                            {/* Song Type */}
                            <ToggleGroupFilterElement name={langDict['filter_song_type']} included={filterValues.includeSongTypes || []} excluded={filterValues.excludeSongTypes || []} options={songTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                                filterValues.includeSongTypes = [...newIncluded]
                                filterValues.excludeSongTypes = [...newExcluded]
                                saveFilterValues()
                            }} />
                            {/* Artist Type */}
                            <ToggleGroupFilterElement name={langDict['filter_artist_type']} included={filterValues.includeArtistTypes || []} excluded={filterValues.excludeArtistTypes || []} options={artistTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                                filterValues.includeArtistTypes = [...newIncluded]
                                filterValues.excludeArtistTypes = [...newExcluded]
                                saveFilterValues()
                            }} />
                        </ExpansionPanel>
                    </li>
                </PopupIconButton>
            </li>
            <li key='filter-bar-row-2'><ul className="flex gap-5 items-center justify-end">
                {/* Active Filters */}
                {activeFilters.length > 0 &&
                    <li key='activeFilters' className="flex-1 overflow-x-auto overflow-y-clip"><ul className="flex gap-3">
                        {activeFilters}
                    </ul></li>
                }
                {/* Order By */}
                <SelectFilterElement minimal icon='sort' clearIcon="sort" name={langDict[filters.orderBy.name]} value={Number(filterValues.orderBy)} defaultValue={filters.orderBy.defaultValue} options={filters.orderBy.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.orderBy = newValue; saveFilterValues() }} />
            </ul></li>
        </ul>
    )
}