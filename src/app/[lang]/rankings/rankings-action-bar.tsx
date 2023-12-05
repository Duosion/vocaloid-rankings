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
        orderBy,
        
        filtersExpanded,
        children,
        onFilterDirectionToggle,
        onViewModeChanged,
        onExpandToggle,
        onDrawerToggle
    }: {
        orderBy: React.ReactNode
        filtersExpanded?: boolean
        children?: React.ReactNode
        onFilterDirectionToggle?: MouseEventHandler
        onViewModeChanged?: (newViewMode: RankingsViewMode) => void
        onExpandToggle?: MouseEventHandler
        onDrawerToggle?: MouseEventHandler
    }
) {
    const langDict = useLocale()

    return (
        <ul className="flex justify-end items-end gap-3 w-full sm:flex-row flex-col-reverse mb-5">

            {/* Leading content */}
            {children}

            <div key='actions' className="sm:w-fit flex-1">
                <ul className="flex justify-end items-center gap-3 w-full">
                    {/* Direction */}
                    <IconButton icon='swap_vert' onClick={onFilterDirectionToggle} />
                    <VerticalDivider className="h-5" />

                    {/* Order By */}
                    {orderBy}

                    <VerticalDivider className="h-5" />

                    <IconButton icon='view_agenda' onClick={_ => {
                        onViewModeChanged?.(RankingsViewMode.LIST)
                    }} />
                    <IconButton icon='grid_view' onClick={_ => {
                        onViewModeChanged?.(RankingsViewMode.GRID)
                    }} />

                    <li key='filter-button' className="md:block hidden"><FilledButton icon={ filtersExpanded ? 'expand_less' : 'expand_more' } text={langDict.rankings_filter} onClick={onExpandToggle} /></li>
                </ul>
            </div>

            {/* floating action button */}
            <FloatingActionButton icon='filter_alt' className="md:hidden fixed" onClick={onDrawerToggle} />
        </ul>
    )
}