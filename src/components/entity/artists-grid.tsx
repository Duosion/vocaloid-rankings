export default function ArtistsGrid(
    {
        className = '',
        children
    }: {
        className?: string
        children?: React.ReactNode
    }
) {
    return <div className={`grid gap-5 grid-cols-1 ${className}`}>{children}</div>
}