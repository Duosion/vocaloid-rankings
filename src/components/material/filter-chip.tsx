import { MouseEventHandler } from "react"
import { Icon } from "./icon"

export enum FilterChipState {
    UNSELECTED,
    SELECTED,
    NEGATE
}

export function FilterChip(
    {
        label,
        state,
        onClick
    }: {
        label: string,
        state: FilterChipState,
        onClick?: MouseEventHandler
    }
) {
    const isUnselected = state == FilterChipState.UNSELECTED
    const isSelected = state == FilterChipState.SELECTED

    return (
        <button
            className='h-8 px-4 rounded-lg border border-on-background text-on-background box-border flex gap-2 items-center justify-center'
            onClick={event => { if (onClick) onClick(event) }}
            style={{
                paddingLeft: isUnselected ? undefined : '8px',
                backgroundColor: isUnselected ? undefined : isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)',
                color: isUnselected ? undefined : isSelected ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-error)',
                border: isUnselected ? undefined : 'none'
            }}
        >
            {isUnselected ? undefined : <Icon icon={isSelected ? 'check' : 'close'} />}
            {label}
        </button>
    )
}