export function RankingsGrid (
    {
        columnsClassName = 'xl:grid-cols-7 lg:grid-cols-6 md:grid-cols-5 sm:grid-cols-3 grid-cols-2',
        children
    }: {
        columnsClassName?: string,
        children: React.ReactNode
    }
) {
    return <ol className={`grid gap-10 w-full mt-3 px-3 ${columnsClassName}`}>{children}</ol>
}