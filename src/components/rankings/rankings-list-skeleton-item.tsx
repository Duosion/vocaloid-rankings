export function RankingsSkeletonListItem(
    {
        keyValue
    }: {
        keyValue: number
    }
) {
    return (
        <li key={keyValue} className={`py-2 rounded-2xl w-full flex gap-3 bg-surface-container-lowest box-border items-center`}>
            {/* spacer to get the height right */}
            <div className="h-[52px] w-full box-border"/>
        </li>
    )
}