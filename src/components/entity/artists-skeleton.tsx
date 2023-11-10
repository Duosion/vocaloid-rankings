import { RankingsViewMode } from "@/app/[lang]/rankings/types";
import { ArtistCardSkeletonItem } from "./artist-card-skeleton-item";
import ArtistsGrid from "./artists-grid";

export function ArtistsSkeleton(
    {
        elementCount,
        className
    }: {
        elementCount: number
        className?: string
    }
) {
    const skeletonItems: JSX.Element[] = []

    for (let i = 0; i < elementCount; i++) {
        skeletonItems.push(<ArtistCardSkeletonItem/>)
    }

    return <ArtistsGrid className={className}>{skeletonItems}</ArtistsGrid>
}