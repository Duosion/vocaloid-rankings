export function VerticalDivider(
    {
        className = ''
    }: {
        className?: string
    }
) {
    return (
        <hr className={`opacity-50 border-outline-variant w-0 border-r m-0 ${className}`}/>
    )
}