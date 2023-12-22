export function Divider(
    {
        className = ''
    }: {
        className?: string
    }
) {
    return (
        <hr className={`w-full opacity-50 border-outline-variant border-t-1 mx-auto ${className}`}/>
    )
}