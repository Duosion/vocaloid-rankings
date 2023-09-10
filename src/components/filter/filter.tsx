export function FilterElement(
    {
        name,
        children,
        minimal = false
    }: {
        name: string,
        children?: React.ReactNode
        minimal?: boolean
    }
) {
    return (
        <li key={name} className="w-fit h-fit flex flex-col font-bold">
            {!minimal ? <h3 className="text-on-background text-lg mb-2">{name}</h3> : undefined}
            {children}
        </li>
    )
}