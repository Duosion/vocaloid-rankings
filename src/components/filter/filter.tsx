export function FilterElement(
    {
        name,
        children,
        minimal = false,
        className
    }: {
        name: string,
        children?: React.ReactNode
        minimal?: boolean
        className?: string
    }
) {
    return (
        <li key={name} className={`w-fit h-fit flex flex-col font-bold ${className}`}>
            {!minimal ? <h3 className="text-on-background text-lg mb-2">{name}</h3> : undefined}
            {children}
        </li>
    )
}