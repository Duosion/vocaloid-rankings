export function ActiveFilter(
    {
        name,
        onClick
    }: {
        name?: string,
        onClick?: () => void
    }
) {
    const className = name ? "px-3 py-1 rounded-lg text-on-background border border-on-background box-border whitespace-nowrap" : "px-3 py-1 h-8 w-24 rounded-lg bg-surface-container-lowest box-border whitespace-nowrap"
    return (
        <li key={name}>
            <button className={className} onClick={() => {
                if (onClick) {
                    onClick()
                }
            }}>{name}</button>
        </li>
    )
}