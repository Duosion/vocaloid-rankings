export function RankingsGrid (
    {
        columnsClassName = 'xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2',
        children
    }: {
        columnsClassName?: string,
        children: React.ReactNode
    }
) {
    return <ol className={`grid gap-10 w-full mt-3 ${columnsClassName}`}>{children}</ol>
}