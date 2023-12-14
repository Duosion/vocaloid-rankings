'use client'
import { ActiveFilter } from "@/components/filter/active-filter"
import { DateFilterElement } from "@/components/filter/date-filter"
import { SelectFilterElement } from "@/components/filter/select-filter"
import { Divider } from "@/components/material/divider"
import { FilledButton } from "@/components/material/filled-button"
import { FloatingActionButton } from "@/components/material/floating-action-button"
import { IconButton } from "@/components/material/icon-button"
import { VerticalDivider } from "@/components/material/vertical-divider"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { Expander } from "@/components/transitions/expander"
import { ModalDrawer, ModalDrawerSide } from "@/components/transitions/modal-drawer"
import { generateTimestamp } from "@/lib/utils"
import { useRef, useState } from "react"
import { Filter, FilterType, InputFilter, RankingsViewMode, SelectFilter, TrendingFilterBarValues, TrendingFilters } from "./types"

export function TrendingActiveFilterBar(
    {
        filters,
        filterValues,
        currentTimestamp,
        setFilterValues,
        setRankingsViewMode,
    }: {
        filters: TrendingFilters
        filterValues: TrendingFilterBarValues
        currentTimestamp: Date
        setFilterValues: (newValues: TrendingFilterBarValues, route?: boolean, merge?: boolean) => void,
        setRankingsViewMode: (newMode: RankingsViewMode) => void
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
                        const name = filter == filters.timestamp && filterValues.timePeriod == 4 && filterValues.from ? filters.from.name : filter.name
                        activeFilters.push(<ActiveFilter name={`${langDict[name]}: ${generateTimestamp(value as Date)}`} onClick={() => { filterValues[key as keyof typeof filterValues] = undefined; setFilterValues(filterValues) }} />)
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

        </ModalDrawer>

        <ul className="flex justify-end items-end gap-3 w-full sm:flex-row flex-col-reverse mb-5">

            {/* Active Filters */}
            {activeFilterCount > 0 ? <div key='active-filters' className="flex-1"><ul className="flex justify-end items-center gap-3 w-full sm:flex-row flex-col-reverse mb-5">
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
            </ul></div> : undefined}

            <div key='actions' className="sm:w-fit flex-1">
                <ul className="flex justify-end items-center gap-3 w-full">
                    {/* Direction */}
                    <IconButton icon='swap_vert' onClick={() => {
                        filterValues.direction = filterValues.direction === 1 ? 0 : 1;
                        setFilterValues(filterValues)
                    }} />

                    <VerticalDivider className="h-5" />

                    <IconButton icon='view_agenda' onClick={_ => setRankingsViewMode(RankingsViewMode.LIST)} />
                    <IconButton icon='grid_view' onClick={_ => setRankingsViewMode(RankingsViewMode.GRID)} />

                    <li key='filter-button' className="md:block hidden"><FilledButton icon={filtersExpanded ? 'expand_less' : 'expand_more'} text={langDict.rankings_filter} onClick={() => setFiltersExpanded(!filtersExpanded)} /></li>
                </ul>
            </div>

            {/* floating action button */}
            <FloatingActionButton icon='filter_alt' className="md:hidden fixed" onClick={() => setDrawerOpen(!drawerOpen)} />
        </ul>

        <Expander visible={filtersExpanded} className="w-full md:grid hidden">
            <Divider className="mb-5" />
            <div className="h-fit w-full gap-x-10 gap-y-8 grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 mb-5">


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

            </div>
            {activeFilterCount > 0 ? <Divider className="mb-5" /> : undefined}
        </Expander>

    </>

}