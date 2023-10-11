export function FilterElement(
    {
        name,
        children,
        minimal = false,
        shrink = false,
        className = ''
    }: {
        name: string,
        children?: React.ReactNode
        minimal?: boolean
        shrink?: boolean
        className?: string
    }
) {
    return (
        <li key={name} className={`h-fit flex flex-col font-bold ${minimal || shrink ? 'w-fit' : 'flex-1'} ${className}`}>
            {!minimal ? <h3 className="text-on-background text-lg mb-2">{name}</h3> : undefined}
            {children}
        </li>
    )
}