import { RankingsViewMode } from "@/app/[lang]/rankings/types";
import { RankingsSkeletonListItem } from "./rankings-list-skeleton-item";
import { RankingsSkeletonGridItem } from "./rankings-grid-skeleton-item";
import { RankingsList } from "./rankings-list";
import { RankingsGrid } from "./rankings-grid";

export function RankingsSkeleton(
    {
        elementCount,
        viewMode,
        columnsClassName
    }: {
        elementCount: number
        viewMode: RankingsViewMode
        columnsClassName?: string
    }
) {
    const skeletonItems: JSX.Element[] = []
    const isListMode = viewMode == RankingsViewMode.LIST

    for (let i = 0; i < elementCount; i++) {
        skeletonItems.push(isListMode ? <RankingsSkeletonListItem keyValue={i} /> : <RankingsSkeletonGridItem keyValue={i}/>)
    }

    return isListMode ? <RankingsList>{skeletonItems}</RankingsList> : <RankingsGrid columnsClassName={columnsClassName}>{skeletonItems}</RankingsGrid>
}