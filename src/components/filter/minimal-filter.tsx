export function MinimalFilterElement(
    {
        name,
        children,
        className = ''
    }: {
        name: string,
        children?: React.ReactNode
        className?: string
    }
) {
    return (
        <li key={name} className={`h-fit flex flex-col font-bold w-fit ${className}`}>
            {children}
        </li>
    )
}