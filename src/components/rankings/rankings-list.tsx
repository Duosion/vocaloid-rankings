export function RankingsList(
    {
        children
    }: {
        children: JSX.Element[] | JSX.Element
    }
) {
    return <ol className="flex flex-col gap-5 w-full">{children}</ol>
}