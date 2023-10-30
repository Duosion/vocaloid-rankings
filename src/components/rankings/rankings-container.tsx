import { RankingsViewMode } from "@/app/[lang]/rankings/types"
import { RankingsList } from "./rankings-list"
import { RankingsGrid } from "./rankings-grid"
import { RankingsGridColumns } from "@/lib/material/types"

export function RankingsContainer(
    {
        viewMode,
        columns,
        children
    }: {
        viewMode: RankingsViewMode
        columns?: RankingsGridColumns
        children: JSX.Element[] | JSX.Element
    }
) {
    return viewMode == RankingsViewMode.LIST ? <RankingsList>{children}</RankingsList> : <RankingsGrid columns={columns}>{children}</RankingsGrid>
}