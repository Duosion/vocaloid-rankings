export function FullFilterElement(
    {
        name,
        nameTrailing,
        children,
        className = ''
    }: {
        name: string,
        nameTrailing?: React.ReactNode
        children?: React.ReactNode
        shrink?: boolean
        className?: string
    }
) {
    return (
        <li key={name} className={`h-fit flex flex-col font-bold ${className}`}>
            <div className="flex gap-3 justify-end items-end mb-2">
                <h3 className="text-on-surface-variant text-lg flex-1">{name}</h3>
                {nameTrailing}
            </div>
            {children}
        </li>
    )
}