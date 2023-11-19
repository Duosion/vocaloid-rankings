import { ActiveFilter } from "@/components/filter/active-filter"
import { FloatingActionButton } from "@/components/material/floating-action-button"
import { IconButton } from "@/components/material/icon-button"
import { VerticalDivider } from "@/components/material/vertical-divider"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { MouseEventHandler } from "react"
import { RankingsViewMode } from "./types"
import { FilledButton } from "@/components/material/filled-button"

export function RankingsActionBar(
    {
        activeFilters,
        orderBy,
        onClearAllFilters,
        onFilterDirectionToggle,
        onViewModeChanged,
        onOpenFilters,
    }: {
        activeFilters: React.ReactNode[],
        orderBy: React.ReactNode,
        onClearAllFilters?: () => void,
        onFilterDirectionToggle?: MouseEventHandler,
        onViewModeChanged?: (newViewMode: RankingsViewMode) => void,
        onOpenFilters?: MouseEventHandler
    }
) {
    const langDict = useLocale()

    const activeFilterCount = activeFilters.length

    return (
        <ul className="flex justify-end items-center gap-3 w-full sm:flex-row flex-col-reverse">
            {/* Active Filters */}
            {activeFilterCount > 0 ?
                <li key='activeFilters' className="flex-1 overflow-x-auto overflow-y-clip sm:w-fit w-full"><ul className="flex gap-3">
                    {activeFilterCount > 1 ?
                        <ActiveFilter name={langDict.filter_clear_all} iconAlwaysVisible filled
                            onClick={onClearAllFilters} />
                        : undefined}
                    {activeFilters}
                </ul></li>
                : undefined}

            <div key='actions' className="sm:w-fit w-full">
                <ul className="flex justify-end items-center gap-3 w-full">
                    {/* Direction */}
                    <IconButton icon='swap_vert' onClick={onFilterDirectionToggle} />
                    <VerticalDivider className="h-5" />

                    {/* Order By */}
                    {orderBy}

                    <VerticalDivider className="h-5" />
                    <IconButton icon='view_agenda' onClick={_ => {
                        if (onViewModeChanged) onViewModeChanged(RankingsViewMode.LIST)
                    }} />
                    <IconButton icon='grid_view' onClick={_ => {
                        if (onViewModeChanged) onViewModeChanged(RankingsViewMode.GRID)
                    }} />

                    <li key='filter-button' className="sm:block hidden"><FilledButton icon='filter_alt' text={langDict.rankings_filter} onClick={onOpenFilters} /></li>
                </ul>
            </div>

            {/* floating action button */}
            <FloatingActionButton icon='filter_alt' className="sm:hidden fixed" onClick={onOpenFilters} />
        </ul>
    )
}