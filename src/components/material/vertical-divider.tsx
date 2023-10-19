export function VerticalDivider(
    {
        className = ''
    }: {
        className?: string
    }
) {
    return (
        <hr className={`opacity-50 border-outline-variant border-r m-auto ${className}`}/>
    )
}