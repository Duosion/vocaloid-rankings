export function ArtistCardSkeletonItem(
    {
        className = ''
    }: {
        className?: string
    }
) {
    return (
        <div className={`bg-surface-container-low text-on-surface rounded-2xl relative flex gap-2 items-center p-2 ${className}`}>
            <figure className="h-14 w-14 aspect-square box-border rounded-xl bg-surface-container"/>
            <div className="rounded-xl bg-surface-container h-5 w-full"/>
        </div>
    )
}