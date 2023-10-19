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
        <li key={name} className={`h-fit flex flex-col font-bold md:max-w-[300px] ${minimal || shrink ? 'w-fit' : 'md:flex-1 w-full'} ${className}`}>
            {!minimal ? <h3 className="text-on-background text-lg mb-2">{name}</h3> : undefined}
            {children}
        </li>
    )
}