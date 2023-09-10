export function ActiveFilter(
    {
        name,
        onClick
    }: {
        name: string,
        onClick?: () => void
    }
) {
    return (
        <li key={name}>
            <button className="px-3 py-1 rounded-lg text-on-background border border-on-background box-border" onClick={() => {
                if (onClick) {
                    onClick()
                }
            }}>{name}</button>
        </li>
    )
}