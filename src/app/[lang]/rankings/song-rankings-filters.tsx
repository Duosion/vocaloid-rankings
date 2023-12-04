'use client'
import { ActiveFilter } from "@/components/filter/active-filter"
import { ArtistSearchFilter } from "@/components/filter/artist-search-filter"
import { BinaryToggleFilterElement } from "@/components/filter/binary-toggle-filter"
import { DateFilterElement } from "@/components/filter/date-filter"
import { InputFilterElement } from "@/components/filter/input-filter"
import { MultiSelectFilterElement } from "@/components/filter/multi-select-filter"
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
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { Expander } from "@/components/transitions/expander"
import { ModalDrawer, ModalDrawerSide } from "@/components/transitions/modal-drawer"
import { generateTimestamp, timeoutDebounce } from "@/lib/utils"
import { useRef, useState } from "react"
import { CheckboxFilter, EntityNames, Filter, FilterType, InputFilter, MultiFilter, RankingsFilters, RankingsViewMode, SelectFilter, SongRankingsFilterBarValues } from "./types"

export function SongRankingsFilterBar(
    {
        filters,
        filterValues,
        currentTimestamp,
        entityNames,
        setFilterValues,
        setRankingsViewMode,
        setEntityNames
    }: {
        filters: RankingsFilters
        filterValues: SongRankingsFilterBarValues
        currentTimestamp: Date
        entityNames: EntityNames,
        setFilterValues: (newValues: SongRankingsFilterBarValues, route?: boolean, merge?: boolean) => void,
        setRankingsViewMode: (newMode: RankingsViewMode) => void,
        setEntityNames: (newNames: EntityNames) => void
    }
) {

    const [filtersExpanded, setFiltersExpanded] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)

    const langDict = useLocale()

    // functions
    const closeDrawer = () => setDrawerOpen(false)

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

    const activeFilterCount = activeFilters.length

    return <>

        <ModalDrawer visible={drawerOpen} onClose={closeDrawer} side={ModalDrawerSide.RIGHT} className="md:hidden">
            <header className="flex gap-5 items-center justify-center">
                <h3 className="text-3xl flex-1">{langDict.rankings_filter}</h3>
                <IconButton icon='close' onClick={closeDrawer} />
            </header>

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
                value={Number(filterValues.publishDay)}
                defaultValue={0}
                start={1}
                end={32}
                onValueChanged={newValue => {
                    filterValues.publishDay = newValue == undefined ? undefined : String(newValue)
                    setFilterValues(filterValues)
                }}
            />


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

            <Divider />

            {/* Single Video Mode */}
            <SwitchFilterElement name={langDict[filters.singleVideo.name]} value={filterValues.singleVideo || filters.singleVideo.defaultValue} onValueChanged={(newValue) => { filterValues.singleVideo = newValue; setFilterValues(filterValues) }} />

            <Divider />

            {/* Include Artists */}
            <ArtistSearchFilter
                name={langDict[filters.includeArtists.name]}
                value={filterValues.includeArtists || []}
                placeholder={langDict[filters.includeArtists.placeholder]}
                entityNames={entityNames}
                inclusionMode={Number(filterValues.includeArtistsMode)}
                defaultInclusionMode={filters.includeArtistsMode.defaultValue}
                onValueChanged={newValue => {
                    filterValues.includeArtists = newValue
                    setFilterValues(filterValues)
                }}
                onEntityNamesChanged={setEntityNames}
                onInclusionModeChanged={newValue => {
                    filterValues.includeArtistsMode = newValue
                    setFilterValues(filterValues)
                }}
            />
            {/* Exclude Artists */}
            <ArtistSearchFilter
                name={langDict[filters.excludeArtists.name]}
                value={filterValues.excludeArtists || []}
                placeholder={langDict[filters.excludeArtists.placeholder]}
                entityNames={entityNames}
                inclusionMode={Number(filterValues.excludeArtistsMode)}
                defaultInclusionMode={filters.excludeArtistsMode.defaultValue}
                onValueChanged={newValue => {
                    filterValues.excludeArtists = newValue
                    setFilterValues(filterValues)
                }}
                onEntityNamesChanged={setEntityNames}
                onInclusionModeChanged={newValue => {
                    filterValues.excludeArtistsMode = newValue
                    setFilterValues(filterValues)
                }}
            />

            {/* Include Similar Artists */}
            <SwitchFilterElement name={langDict[filters.includeSimilarArtists.name]} value={filterValues.includeSimilarArtists || filters.includeSimilarArtists.defaultValue} onValueChanged={(newValue) => { filterValues.includeSimilarArtists = newValue; setFilterValues(filterValues) }} />


            <Divider />

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
        </ModalDrawer>

        <ul className="flex justify-end items-end gap-3 w-full sm:flex-row flex-col-reverse mb-5">

            {/* Search */}
            <InputFilterElement
                icon='search'
                value={filterValues.search || ''}
                placeholder={langDict[filters.search.placeholder]}
                defaultValue={filters.search.defaultValue}
                className="sm:w-fit w-full"
                onValueChanged={(newValue) => {
                    filterValues.search = newValue
                    setFilterValues(filterValues, false)

                    timeoutDebounce(searchTimeout, 500, () => { setFilterValues(filterValues) })
                }}
            />

            <div key='actions' className="sm:w-fit flex-1">
                <ul className="flex justify-end items-center gap-3 w-full">
                    {/* Direction */}
                    <IconButton icon='swap_vert' onClick={() => {
                        filterValues.direction = filterValues.direction === 1 ? 0 : 1;
                        setFilterValues(filterValues)
                    }} />
                    <VerticalDivider className="h-5" />

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

                    <VerticalDivider className="h-5" />

                    <IconButton icon='view_agenda' onClick={_ => {
                        setRankingsViewMode(RankingsViewMode.LIST)
                    }} />
                    <IconButton icon='grid_view' onClick={_ => {
                        setRankingsViewMode(RankingsViewMode.GRID)
                    }} />

                    <li key='filter-button' className="md:block hidden"><FilledButton icon={ filtersExpanded ? 'expand_less' : 'expand_more' } text={langDict.rankings_filter} onClick={() => setFiltersExpanded(!filtersExpanded)} /></li>
                </ul>
            </div>

            {/* floating action button */}
            <FloatingActionButton icon='filter_alt' className="md:hidden fixed" onClick={_ => setDrawerOpen(!drawerOpen)} />
        </ul>

        <Expander visible={filtersExpanded} className="w-full md:grid hidden">
            <Divider className="mb-5" />
            <div className="h-fit w-full gap-x-10 gap-y-8 grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 mb-5">
                {/* Source Type */}
                <MultiSelectFilterElement
                    name={langDict['filter_view_type']}
                    placeholder={langDict['filter_year_any']}
                    included={filterValues.includeSourceTypes || []}
                    excluded={filterValues.excludeSourceTypes || []}
                    options={sourceTypesOptions} onValueChanged={(newIncluded, newExcluded) => {
                        filterValues.includeSourceTypes = [...newIncluded]
                        filterValues.excludeSourceTypes = [...newExcluded]
                        setFilterValues(filterValues)
                    }}
                />

                {/* Song Type */}
                <MultiSelectFilterElement
                    name={langDict['filter_song_type']}
                    placeholder={langDict['filter_year_any']}
                    included={filterValues.includeSongTypes || []}
                    excluded={filterValues.excludeSongTypes || []}
                    options={songTypesOptions}
                    onValueChanged={(newIncluded, newExcluded) => {
                        filterValues.includeSongTypes = [...newIncluded]
                        filterValues.excludeSongTypes = [...newExcluded]
                        setFilterValues(filterValues)
                    }}
                />

                {/* Artist Type */}
                <MultiSelectFilterElement
                    searchable
                    name={langDict['filter_artist_type']}
                    placeholder={langDict['filter_year_any']}
                    included={filterValues.includeArtistTypes || []}
                    excluded={filterValues.excludeArtistTypes || []}
                    defaultInclusionMode={filters.includeArtistTypesMode.defaultValue}
                    inclusionMode={filterValues.includeArtistTypesMode}
                    options={artistTypesOptions}
                    onValueChanged={(newIncluded, newExcluded) => {
                        filterValues.includeArtistTypes = [...newIncluded]
                        filterValues.excludeArtistTypes = [...newExcluded]
                        setFilterValues(filterValues)
                    }}
                    onInclusionModeChanged={newMode => {
                        filterValues.includeArtistTypesMode = newMode
                        setFilterValues(filterValues)
                    }}
                />

                {/* Single Video Mode */}
                <SwitchFilterElement name={langDict[filters.singleVideo.name]} value={filterValues.singleVideo || filters.singleVideo.defaultValue} onValueChanged={(newValue) => { filterValues.singleVideo = newValue; setFilterValues(filterValues) }} />

                {/* Include Similar Artists */}
                <SwitchFilterElement name={langDict[filters.includeSimilarArtists.name]} value={filterValues.includeSimilarArtists || filters.includeSimilarArtists.defaultValue} onValueChanged={(newValue) => { filterValues.includeSimilarArtists = newValue; setFilterValues(filterValues) }} />

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
                    value={Number(filterValues.publishDay)}
                    defaultValue={0}
                    start={1}
                    end={32}
                    onValueChanged={newValue => {
                        filterValues.publishDay = newValue == undefined ? undefined : String(newValue)
                        setFilterValues(filterValues)
                    }}
                />

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

                {/* Include Artists */}
                <ArtistSearchFilter
                    name={langDict[filters.includeArtists.name]}
                    value={filterValues.includeArtists || []}
                    placeholder={langDict[filters.includeArtists.placeholder]}
                    entityNames={entityNames}
                    inclusionMode={Number(filterValues.includeArtistsMode)}
                    defaultInclusionMode={filters.includeArtistsMode.defaultValue}
                    onValueChanged={newValue => {
                        filterValues.includeArtists = newValue
                        setFilterValues(filterValues)
                    }}
                    onEntityNamesChanged={setEntityNames}
                    onInclusionModeChanged={newValue => {
                        filterValues.includeArtistsMode = newValue
                        setFilterValues(filterValues)
                    }}
                />
                {/* Exclude Artists */}
                <ArtistSearchFilter
                    name={langDict[filters.excludeArtists.name]}
                    value={filterValues.excludeArtists || []}
                    placeholder={langDict[filters.excludeArtists.placeholder]}
                    entityNames={entityNames}
                    inclusionMode={Number(filterValues.excludeArtistsMode)}
                    defaultInclusionMode={filters.excludeArtistsMode.defaultValue}
                    onValueChanged={newValue => {
                        filterValues.excludeArtists = newValue
                        setFilterValues(filterValues)
                    }}
                    onEntityNamesChanged={setEntityNames}
                    onInclusionModeChanged={newValue => {
                        filterValues.excludeArtistsMode = newValue
                        setFilterValues(filterValues)
                    }}
                />

            </div>
            {activeFilterCount > 0 ? <Divider className="mb-5" /> : undefined}
        </Expander>

        {/* Active Filters */}
        {activeFilterCount > 0 ? <ul className="flex justify-end items-center gap-3 w-full sm:flex-row flex-col-reverse mb-5">
            <li key='activeFilters' className="flex-1 overflow-x-auto overflow-y-clip sm:w-fit w-full"><ul className="flex gap-3">
                {activeFilterCount > 1 ?
                    <ActiveFilter name={langDict.filter_clear_all} iconAlwaysVisible filled
                        onClick={() => {
                            filterValues = {}
                            setFilterValues(filterValues, true, false)
                        }} />
                    : undefined}
                {activeFilters}
            </ul></li>
        </ul> : undefined}

    </>

}