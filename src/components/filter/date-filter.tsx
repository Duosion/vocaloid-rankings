import { Elevation } from "@/lib/material/types"
import { FilterElement } from "./filter"
import { elevationToClass } from "@/lib/material/material"
import { generateTimestamp, localISOTimestampToDate } from "@/lib/utils"

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
        value: Date
        min?: string
        max?: string
        elevation?: Elevation
        onValueChanged?: (newValue?: Date) => void
    }
) {
    function setValue(newValue?: Date) {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <div className="py-2 px-4 rounded-xl text-on-surface flex gap-3 text-base font-normal"
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
            >
                <input
                    type='date'
                    value={generateTimestamp(value)}
                    min={min}
                    max={max}
                    onChange={
                        event => {
                            const asDate = localISOTimestampToDate(event.currentTarget.value)
                            setValue(asDate ? asDate : undefined)
                        }
                    }
                    className={`cursor-text bg-transparent min-w-fit w-32 outline-none text-left flex-1`} />
            </div>
        </FilterElement>
    )
}