export function RankingsList(
    {
        children
    }: {
        children: React.ReactNode
    }
) {
    return <ol className="flex flex-col gap-5 w-full">{children}</ol>
}