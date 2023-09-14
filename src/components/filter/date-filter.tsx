import { Elevation } from "@/material/types"
import { FilterElement } from "./filter"
import { elevationToClass } from "@/material"

export function DateFilterElement(
    {
        name,
        value,
        min,
        max,
        elevation = Elevation.LOW,
        onValueChanged
    }: {
        name: string
        value: string
        min?: string
        max?: string
        elevation?: Elevation
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <div className="py-2 px-4 rounded-xl text-on-surface flex gap-3 text-base font-normal"
                style={{backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})`}}
            >
                <input type='date' value={value} min={min} max={max} onChange={event => setValue(event.currentTarget.value)} className={`cursor-text bg-transparent min-w-fit w-32 outline-none text-left`} />
            </div>
        </FilterElement>
    )
}