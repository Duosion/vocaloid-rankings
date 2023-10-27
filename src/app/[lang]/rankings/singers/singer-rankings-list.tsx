'use client'
import { ActiveFilter } from "@/components/filter/active-filter"
import { ArtistSearchFilter } from "@/components/filter/artist-search-filter"
import { DateFilterElement } from "@/components/filter/date-filter"
import { InputFilterElement } from "@/components/filter/input-filter"
import { NumberInputFilterElement } from "@/components/filter/number-input-filter"
import { NumberSelectFilterElement } from "@/components/filter/number-select-filter"
import { SelectFilterElement } from "@/components/filter/select-filter"
import { SwitchFilterElement } from "@/components/filter/switch-filter"
import { ToggleGroupFilterElement } from "@/components/filter/toggle-group-filter"
import { Divider } from "@/components/material/divider"
import { FilledButton } from "@/components/material/filled-button"
import { FloatingActionButton } from "@/components/material/floating-action-button"
import { IconButton } from "@/components/material/icon-button"
import { VerticalDivider } from "@/components/material/vertical-divider"
import { Modal } from "@/components/transitions/modal"
import { generateTimestamp, timeoutDebounce } from "@/lib/utils"
import { LanguageDictionary } from "@/localization"
import { useRef, useState } from "react"
import { ArtistRankingsFilterBarValues, ArtistRankingsFilters, CheckboxFilter, EntityNames, Filter, FilterType, InputFilter, MultiFilter, RankingsViewMode, SelectFilter } from "../types"

export function SingerRankingsActiveFilterBar(
    {
        filters,
        langDict,
        filterValues,
        currentTimestamp,
        setFilterValues,
        setRankingsViewMode,
        entityNames,
        onEntityNamesChanged
    }: {
        filters: ArtistRankingsFilters
        langDict: LanguageDictionary
        filterValues: ArtistRankingsFilterBarValues
        currentTimestamp: Date
        setFilterValues: (newValues: ArtistRankingsFilterBarValues, route?: boolean, merge?: boolean) => void,
        setRankingsViewMode: (newMode: RankingsViewMode) => void,
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
                    {/* Search */}
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

                    {/* Single Video Mode */}
                    <SwitchFilterElement name={langDict[filters.singleVideo.name]} value={filterValues.singleVideo || filters.singleVideo.defaultValue} onValueChanged={(newValue) => { filterValues.singleVideo = newValue; setFilterValues(filterValues) }} />
                </FilterGroup>

                <Divider />

                <FilterGroup>
                    {/* Song Publish Year */}
                    <NumberSelectFilterElement
                        reverse
                        name={langDict[filters.songPublishYear.name]}
                        placeholder={langDict[filters.songPublishYear.placeholder]}
                        value={Number(filterValues.songPublishYear)}
                        defaultValue={0}
                        start={2007}
                        end={new Date().getFullYear() + 1}
                        onValueChanged={newValue => {
                            filterValues.songPublishYear = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Song Publish Month */}
                    <NumberSelectFilterElement
                        name={langDict[filters.songPublishMonth.name]}
                        placeholder={langDict[filters.songPublishMonth.placeholder]}
                        value={Number(filterValues.songPublishMonth)}
                        defaultValue={0}
                        start={1}
                        end={13}
                        onValueChanged={newValue => {
                            filterValues.songPublishMonth = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Song Publish Day */}
                    <NumberSelectFilterElement
                        name={langDict[filters.songPublishDay.name]}
                        placeholder={langDict[filters.songPublishDay.placeholder]}
                        value={Number(filterValues.songPublishDay)}
                        defaultValue={0}
                        start={1}
                        end={32}
                        onValueChanged={newValue => {
                            filterValues.songPublishDay = newValue == undefined ? undefined : String(newValue)
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
                    {/* Release Year */}
                    <NumberSelectFilterElement
                        reverse
                        name={langDict[filters.releaseYear.name]}
                        placeholder={langDict[filters.releaseYear.placeholder]}
                        value={Number(filterValues.releaseYear)}
                        defaultValue={0}
                        start={2007}
                        end={new Date().getFullYear() + 1}
                        onValueChanged={newValue => {
                            filterValues.releaseYear = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Release Month */}
                    <NumberSelectFilterElement
                        name={langDict[filters.releaseMonth.name]}
                        placeholder={langDict[filters.releaseMonth.placeholder]}
                        value={Number(filterValues.releaseMonth)}
                        defaultValue={0}
                        start={1}
                        end={13}
                        onValueChanged={newValue => {
                            filterValues.releaseMonth = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                    {/* Release Day */}
                    <NumberSelectFilterElement
                        name={langDict[filters.releaseDay.name]}
                        placeholder={langDict[filters.releaseDay.placeholder]}
                        value={Number(filterValues.releaseDay)}
                        defaultValue={0}
                        start={1}
                        end={32}
                        onValueChanged={newValue => {
                            filterValues.releaseDay = newValue == undefined ? undefined : String(newValue)
                            setFilterValues(filterValues)
                        }}
                    />
                </FilterGroup>
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
                    {/* Combine Similar Artists */}
                    <SwitchFilterElement name={langDict[filters.combineSimilarArtists.name]} value={filterValues.combineSimilarArtists || filters.combineSimilarArtists.defaultValue} onValueChanged={(newValue) => { filterValues.combineSimilarArtists = newValue; setFilterValues(filterValues) }} />
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
            </Modal>

            <ul className="flex justify-end items-center gap-3 w-full">
                {/* Active Filters */}
                {activeFilterCount > 0 ?
                    <li key='activeFilters' className="flex-1 overflow-x-auto overflow-y-clip"><ul className="flex gap-3">
                        {activeFilterCount > 1 ?
                            <ActiveFilter name={langDict.filter_clear_all} iconAlwaysVisible filled
                                onClick={() => {
                                    filterValues = {}
                                    setFilterValues(filterValues, true, false)
                                }} />
                            : undefined}
                        {activeFilters}
                    </ul></li>
                    : undefined}


                {/* Order By */}
                <SelectFilterElement
                    minimal
                    icon='sort'
                    clearIcon="sort"
                    name={langDict[filters.orderBy.name]}
                    value={Number(filterValues.orderBy)}
                    defaultValue={filters.orderBy.defaultValue}
                    options={filters.orderBy.values.map(value => langDict[value.name])}
                    onValueChanged={(newValue) => { filterValues.orderBy = newValue; setFilterValues(filterValues) }}
                />

                <VerticalDivider className=" h-5" />
                <IconButton icon='view_agenda' onClick={_ => setRankingsViewMode(RankingsViewMode.LIST)} />
                <IconButton icon='view_cozy' onClick={_ => setRankingsViewMode(RankingsViewMode.GRID)} />

                <li key='filter-button' className="sm:block hidden"><FilledButton icon='filter_alt' text={langDict.rankings_filter} onClick={_ => setFilterModalOpen(true)} /></li>
            </ul>

            {/* floating action button */}
            <FloatingActionButton icon='filter_alt' className="sm:hidden fixed" onClick={_ => setFilterModalOpen(true)} />
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