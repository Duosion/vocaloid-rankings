import { Icon } from "../material/icon"

export function ActiveFilter(
    {
        name,
        icon,
        onClick
    }: {
        name?: string,
        icon?: string,
        onClick?: () => void
    }
) {
    const className = `px-3 py-1 rounded-lg box-border whitespace-nowrap flex items-center justify-center gap-2 ${name ? " text-on-background border border-on-background" : "h-8 w-24 bg-surface-container-lowest box-border whitespace-nowrap"}`
    return (
        <li key={name}>
            <button className={className} onClick={() => {
                if (onClick) {
                    onClick()
                }
            }}>                
                {name}
                {icon ? <Icon icon={icon}/> : undefined}
            </button>
        </li>
    )
}