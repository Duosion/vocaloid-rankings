export function RankingsSkeletonGridItem(
    {
        keyValue
    }: {
        keyValue: number
    }
) {
    return (
        <li key={keyValue} className={`w-full flex flex-col gap-3 items-center`}>
            <div className="aspect-square w-full h-auto rounded-3xl bg-surface-container-low box-border"/>
            <div className="h-8 rounded-full bg-surface-container-low w-full"/>
            <div className="h-6 rounded-full bg-surface-container-low w-3/4"/>
        </li>
    )
}