'use client'
import { LanguageDictionary } from "@/localization"
import { useRef, useState } from "react"
import { CheckboxFilter, Filter, FilterType, InputFilter, RankingsFilters, SelectFilter, SongRankingsFilterBarValues, MultiFilter, EntityNames, MultiEntityFilter } from "./types"
import { ActiveFilter } from "@/components/filter/active-filter"
import { SelectFilterElement } from "@/components/filter/select-filter"
import { FilledButton } from "@/components/material/filled-button"
import { Modal } from "@/components/transitions/modal"
import { IconButton } from "@/components/material/icon-button"
import { InputFilterElement } from "@/components/filter/input-filter"
import { generateTimestamp, timeoutDebounce } from "@/lib/utils"
import { NumberInputFilterElement } from "@/components/filter/number-input-filter"
import { NumberSelectFilterElement } from "@/components/filter/number-select-filter"
import { DateFilterElement } from "@/components/filter/date-filter"
import { SwitchFilterElement } from "@/components/filter/switch-filter"
import { ToggleGroupFilterElement } from "@/components/filter/toggle-group-filter"
import { ArtistSearchFilter } from "@/components/filter/artist-search-filter"
import { Divider } from "@/components/material/divider"
import { BinaryToggleFilterElement } from "@/components/filter/binary-toggle-filter"

export function SongRankingsActiveFilterBar(
    {
        filters,
        langDict,
        filterValues,
        currentTimestamp,
        setFilterValues,
        entityNames,
        onEntityNamesChanged
    }: {
        filters: RankingsFilters
        langDict: LanguageDictionary
        filterValues: SongRankingsFilterBarValues
        currentTimestamp: Date
        setFilterValues: (newValues: SongRankingsFilterBarValues, route?: boolean, merge?: boolean) => void,
        entityNames: EntityNames,
        onEntityNamesChanged: (newNames: EntityNames) => void
    }
) {
    const [filterModalOpen, setFilterModalOpen] = useState(false)

    // timeouts
    const searchTimeout = useRef<NodeJS.Timeout>()
    const minViewsTimeout = useRef<NodeJS.Timeout>()
    const maxViewsTimeout = useRef<NodeJS.Timeout>()

    // options
    const sourceTypesOptions = filters.includeSourceTypes.values.map(value => langDict[value.name])
    const songTypesOptions = filters.includeSongTypes.values.map(value => langDict[value.name])
    const artistTypesOptions = filters.includeArtistTypes.values.map(value => langDict[value.name])

    // timestamps
    const currentTimestampIso = generateTimestamp(currentTimestamp)

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
                    if (parsedValue != defaultValue && (filter == filters.timePeriod && valueNumber != 4 && !filterValues.from)) {
                        const name = options[parsedValue].name
                        activeFilters.push(<ActiveFilter name={langDict[name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; setFilterValues(filterValues) }} />)
                    }
                    break
                }
                case FilterType.INPUT: {
                    const defaultValue = (filter as InputFilter).defaultValue
                    if (value && value != defaultValue) {
                        activeFilters.push(<ActiveFilter name={`${langDict[filter.name]}: ${String(value)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; setFilterValues(filterValues) }} />)
                    }
                    break
                }
                case FilterType.TIMESTAMP: {
                    if (value != undefined) {
                        const name = filter == filters.timestamp && filterValues.timePeriod == 4 && filterValues.from ? filters.to.name : filter.name
                        activeFilters.push(<ActiveFilter name={`${langDict[name]}: ${generateTimestamp(value as Date)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = undefined; setFilterValues(filterValues) }} />)
                    }
                    break
                }
                case FilterType.CHECKBOX: {
                    const defaultValue = (filter as CheckboxFilter).defaultValue
                    if (value as boolean != defaultValue) {
                        activeFilters.push(<ActiveFilter name={langDict[filter.name]} onClick={() => { filterValues[key as keyof typeof filterValues] = defaultValue as any; setFilterValues(filterValues) }} />)
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
                                    setFilterValues(filterValues)
                                }} />)
                            }
                        })
                    }
                    break
                }
                case FilterType.MULTI_ENTITY: {
                    const parsedValue = value as number[]
                    if (parsedValue.length > 0) {
                        parsedValue.forEach(val => {
                            if (!isNaN(val)) {
                                const name = entityNames[val]
                                const filterName = name ? `${langDict[filter.name]}: ${name}` : undefined
                                activeFilters.push(<ActiveFilter name={filterName} onClick={() => {
                                    parsedValue.splice(parsedValue.indexOf(val), 1)
                                    filterValues[key as keyof typeof filterValues] = [...parsedValue] as any
                                    setFilterValues(filterValues)
                                }} />)
                            }
                        })
                    }
                    break
                }
            }
        }
    }
    const activeFilterCount = activeFilters.length // the number of active filters

    return (
        <>
            {/* filter modal */}
            <Modal visible={filterModalOpen} onClose={() => setFilterModalOpen(false)}>
                <header className="flex gap-5">
                    <h3 className="text-4xl flex-1">{langDict.rankings_filter}</h3>
                    <IconButton icon='close' onClick={() => setFilterModalOpen(false)} />
                </header>
                <FilterGroup>
                    <InputFilterElement
                        icon='search'
                        name={langDict[filters.search.name]}
                        value={filterValues.search || ''}
                        placeholder={langDict[filters.search.placeholder]}
                        defaultValue={filters.search.defaultValue}
                        onValueChanged={(newValue) => {
                            filterValues.search = newValue
                            setFilterValues(filterValues, false)

                            timeoutDebounce(searchTimeout, 500, () => { setFilterValues(filterValues) })
                        }}
                    />
                </FilterGroup>

                <Divider />

                <FilterGroup>
                    {/* Minimum Views*/}
                    <NumberInputFilterElement name={langDict[filters.minViews.name]} value={filterValues.minViews || filters.minViews.defaultValue} placeholder={langDict[filters.minViews.placeholder]} defaultValue={filters.minViews.defaultValue} onValueChanged={(newValue) => {
                        filterValues.minViews = newValue;
                        setFilterValues(filterValues)

                        timeoutDebounce(minViewsTimeout, 500, () => { setFilterValues(filterValues) })
                    }} />
                    {/* Maximum Views */}
                    <NumberInputFilterElement name={langDict[filters.maxViews.name]} value={filterValues.maxViews || filters.maxViews.defaultValue} placeholder={langDict[filters.maxViews.placeholder]} defaultValue={filters.maxViews.defaultValue} onValueChanged={(newValue) => {
                        filterValues.maxViews = newValue;
                        setFilterValues(filterValues)

                        timeoutDebounce(maxViewsTimeout, 500, () => { setFilterValues(filterValues) })
                    }} />
                    {/* Single Video Mode */}
                    <SwitchFilterElement name={langDict[filters.singleVideo.name]} value={filterValues.singleVideo || filters.singleVideo.defaultValue} onValueChanged={(newValue) => { filterValues.singleVideo = newValue; setFilterValues(filterValues) }} />
                </FilterGroup>

                <Divider />

                <FilterGroup>
                    {/* Publish Year */}
                    <NumberSelectFilterElement
                        reverse
                        name={langDict[filters.publishYear.name]}
                        placeholder={langDict[filters.publishYear.placeholder]}
                        value={Number(filterValues.publishYear)}
                        defaultValue={0}
                        start={2007}
                        end={new Date().getFullYear() + 1}
                        onValueChanged={newValue => {
                            filterValues.publishYear = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Publish Month */}
                    <NumberSelectFilterElement
                        name={langDict[filters.publishMonth.name]}
                        placeholder={langDict[filters.publishMonth.placeholder]}
                        value={Number(filterValues.publishMonth)}
                        defaultValue={0}
                        start={1}
                        end={13}
                        onValueChanged={newValue => {
                            filterValues.publishMonth = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Publish Day */}
                    <NumberSelectFilterElement
                        name={langDict[filters.publishDay.name]}
                        placeholder={langDict[filters.publishDay.placeholder]}
                        value={Number(filterValues.publishYear)}
                        defaultValue={0}
                        start={1}
                        end={32}
                        onValueChanged={newValue => {
                            filterValues.publishDay = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />

                </FilterGroup>
                <FilterGroup>
                    {/* Time Period */}
                    <SelectFilterElement
                        name={langDict[filters.timePeriod.name]}
                        value={Number(filterValues.timePeriod)}
                        defaultValue={filters.timePeriod.defaultValue}
                        options={filters.timePeriod.values.map(value => langDict[value.name])}
                        onValueChanged={(newValue) => {
                            filterValues.timePeriod = newValue
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Timestamp */}
                    {filterValues.timePeriod == 4 ? (
                        <>
                            {/* Custom Date Range Selector */}
                            {/* From Date */}
                            <DateFilterElement
                                name={langDict.filter_time_period_offset_custom_from}
                                value={filterValues.from || currentTimestamp}
                                max={currentTimestampIso}
                                onValueChanged={newValue => {
                                    filterValues.from = newValue
                                    setFilterValues(filterValues)
                                }
                                }
                            />
                            {/* To Date */}
                            <DateFilterElement
                                name={langDict.filter_time_period_offset_custom_to}
                                value={filterValues.timestamp || currentTimestamp}
                                max={currentTimestampIso}
                                onValueChanged={newValue => {
                                    filterValues.timestamp = newValue
                                    setFilterValues(filterValues)
                                }
                                }
                            />
                        </>
                    )
                        : <DateFilterElement
                            name={langDict[filters.timestamp.name]}
                            value={filterValues.timestamp || currentTimestamp}
                            max={currentTimestampIso}
                            onValueChanged={newValue => {
                                filterValues.timestamp = newValue
                                setFilterValues(filterValues)
                            }
                            }
                        />
                    }
                </FilterGroup>

                <Divider />

                <FilterGroup>
                    {/* Include Artists */}
                    <ArtistSearchFilter
                        name={langDict[filters.includeArtists.name]}
                        value={filterValues.includeArtists || []}
                        placeholder={langDict[filters.includeArtists.placeholder]}
                        entityNames={entityNames}
                        onValueChanged={newValue => {
                            filterValues.includeArtists = newValue
                            setFilterValues(filterValues)
                        }}
                        onEntityNamesChanged={onEntityNamesChanged}
                    />
                    {/* Exclude Artists */}
                    <ArtistSearchFilter
                        name={langDict[filters.excludeArtists.name]}
                        value={filterValues.excludeArtists || []}
                        placeholder={langDict[filters.excludeArtists.placeholder]}
                        entityNames={entityNames}
                        onValueChanged={newValue => {
                            filterValues.excludeArtists = newValue
                            setFilterValues(filterValues)
                        }}
                        onEntityNamesChanged={onEntityNamesChanged}
                    />
                </FilterGroup>
                <FilterGroup>
                    {/* Artists Inclusion Mode */}
                    <BinaryToggleFilterElement
                        name={langDict[filters.includeArtistsMode.name]}
                        value={Number(filterValues.includeArtistsMode)}
                        defaultValue={filters.includeArtistsMode.defaultValue}
                        options={filters.includeArtistsMode.values.map(value => langDict[value.name])}
                        onValueChanged={(newValue) => {
                            filterValues.includeArtistsMode = newValue
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Artists Exclusion Mode */}
                    <BinaryToggleFilterElement
                        name={langDict[filters.excludeArtistsMode.name]}
                        value={Number(filterValues.excludeArtistsMode)}
                        defaultValue={filters.excludeArtistsMode.defaultValue}
                        options={filters.excludeArtistsMode.values.map(value => langDict[value.name])}
                        onValueChanged={(newValue) => {
                            filterValues.excludeArtistsMode = newValue
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Include Similar Artists */}
                    <SwitchFilterElement name={langDict[filters.includeSimilarArtists.name]} value={filterValues.includeSimilarArtists || filters.includeSimilarArtists.defaultValue} onValueChanged={(newValue) => { filterValues.includeSimilarArtists = newValue; setFilterValues(filterValues) }} />
                </FilterGroup>

                <Divider />

                {/* Source Type */}
                <ToggleGroupFilterElement name={langDict['filter_view_type']} included={filterValues.includeSourceTypes || []} excluded={filterValues.excludeSourceTypes || []} options={sourceTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                    filterValues.includeSourceTypes = [...newIncluded]
                    filterValues.excludeSourceTypes = [...newExcluded]
                    setFilterValues(filterValues)
                }} />
                {/* Song Type */}
                <ToggleGroupFilterElement name={langDict['filter_song_type']} included={filterValues.includeSongTypes || []} excluded={filterValues.excludeSongTypes || []} options={songTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                    filterValues.includeSongTypes = [...newIncluded]
                    filterValues.excludeSongTypes = [...newExcluded]
                    setFilterValues(filterValues)
                }} />
                {/* Artist Type */}
                <ToggleGroupFilterElement name={langDict['filter_artist_type']} included={filterValues.includeArtistTypes || []} excluded={filterValues.excludeArtistTypes || []} options={artistTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                    filterValues.includeArtistTypes = [...newIncluded]
                    filterValues.excludeArtistTypes = [...newExcluded]
                    setFilterValues(filterValues)
                }} />
                <FilterGroup>
                    {/* Artist Types Inclusion Mode */}
                    <BinaryToggleFilterElement
                        name={langDict[filters.includeArtistTypesMode.name]}
                        value={Number(filterValues.includeArtistTypesMode)}
                        defaultValue={filters.includeArtistTypesMode.defaultValue}
                        options={filters.includeArtistTypesMode.values.map(value => langDict[value.name])}
                        onValueChanged={(newValue) => {
                            filterValues.includeArtistTypesMode = newValue
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Artist Types Exclusion Mode */}
                    <BinaryToggleFilterElement
                        name={langDict[filters.excludeArtistTypesMode.name]}
                        value={Number(filterValues.excludeArtistTypesMode)}
                        defaultValue={filters.excludeArtistTypesMode.defaultValue}
                        options={filters.excludeArtistTypesMode.values.map(value => langDict[value.name])}
                        onValueChanged={(newValue) => {
                            filterValues.excludeArtistTypesMode = newValue
                            setFilterValues(filterValues)
                        }}
                    />
                </FilterGroup>
            </Modal>

            <ul className="flex flex-col gap-3 justify-center w-full">
                <li key='row-1'><ul className="flex gap-5 items-center justify-end w-full">
                    {/* Active Filters */}
                    {activeFilterCount > 0 ?
                        <li key='activeFilters' className="flex-1 overflow-x-auto overflow-y-clip"><ul className="flex gap-3">
                            {activeFilterCount > 1 ?
                                <ActiveFilter name={langDict.filter_clear_all} iconAlwaysVisible filled 
                                onClick={() => {
                                    filterValues = {}
                                    setFilterValues(filterValues, true, false)
                                }}/>
                                : undefined}
                            {activeFilters}
                        </ul></li>
                        : undefined}
                    <li key='filter-button'><FilledButton icon='filter_alt' text={langDict.rankings_filter} onClick={_ => setFilterModalOpen(true)} /></li>
                </ul></li>
                <li key='row-1'><ul className="flex gap-5 items-center justify-end w-full">
                    {/* Search */}
                    <InputFilterElement
                        icon='search'
                        value={filterValues.search || ''}
                        placeholder={langDict[filters.search.placeholder]}
                        defaultValue={filters.search.defaultValue}
                        onValueChanged={(newValue) => {
                            filterValues.search = newValue
                            setFilterValues(filterValues, false)

                            timeoutDebounce(searchTimeout, 500, () => { setFilterValues(filterValues) })
                        }}
                    />

                    {/* divider */}
                    <li key='divider' className="flex-1"></li>

                    {/* Order By */}
                    <SelectFilterElement minimal icon='sort' clearIcon="sort" name={langDict[filters.orderBy.name]} value={Number(filterValues.orderBy)} defaultValue={filters.orderBy.defaultValue} options={filters.orderBy.values.map(value => langDict[value.name])} onValueChanged={(newValue) => { filterValues.orderBy = newValue; setFilterValues(filterValues) }} />
                </ul></li>
            </ul>
        </>

    )
}

// represents a group of filters
function FilterGroup(
    {
        children
    }: {
        children: React.ReactNode
    }
) {
    return (
        <ul className="flex gap-5 md:flex-row flex-col">{children}</ul>
    )
}