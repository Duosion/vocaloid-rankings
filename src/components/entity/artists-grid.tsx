export default function ArtistsGrid(
    {
        className = '',
        children
    }: {
        className?: string
        children: JSX.Element[]
    }
) {
    return <div className={`grid gap-5 grid-cols-1 ${className}`}>{children}</div>
}