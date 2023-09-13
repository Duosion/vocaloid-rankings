import { Elevation } from "@/material/types"
import { Icon } from "../material/icon"
import { FilterElement } from "./filter"
import { elevationToClass } from "@/material"

export function NumberInputFilterElement(
    {
        name,
        value,
        placeholder,
        defaultValue,
        elevation = Elevation.LOW,
        onValueChanged
    }: {
        name: string
        value: string
        placeholder: string
        defaultValue: string,
        elevation?: Elevation
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        const asNumber = Number(newValue)
        if (!isNaN(asNumber) && value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    return (
        <FilterElement key={name} name={name}>
            <search className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={e => e.preventDefault()}
                style={{backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})`}}
            >
                <input type='search' placeholder={placeholder} onChange={event => setValue(event.currentTarget.value)} value={value} className={`cursor-text bg-transparent w-32 outline-none text-left`} />
                {value != defaultValue && <Icon icon='close'></Icon>}
            </search>
        </FilterElement>
    )
}