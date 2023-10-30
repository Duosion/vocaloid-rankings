import { RankingsGridColumns } from "@/lib/material/types"

export function RankingsGrid (
    {
        columns = {
            extraLarge: 7,
            large: 5,
            medium: 4,
            small: 3,
            default: 2
        },
        children
    }: {
        columns?: RankingsGridColumns
        children: JSX.Element[] | JSX.Element
    }
) {
    return <ol className={`grid xl:grid-cols-${columns.extraLarge} lg:grid-cols-${columns.large} md:grid-cols-${columns.medium} sm:grid-cols-${columns.small} grid-cols-${columns.default} gap-10 w-full mt-3`}>{children}</ol>
}