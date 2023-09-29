import { Elevation } from "@/material/types"
import { Icon } from "../material/icon"
import { FilterElement } from "./filter"
import { elevationToClass } from "@/material"
import { MinimalIconButton } from "../material/minimal-icon-button"

export function InputFilterElement(
    {
        name,
        value,
        placeholder,
        defaultValue,
        icon,
        elevation = Elevation.LOW,
        onValueChanged
    }: {
        name: string
        value: string
        placeholder: string
        defaultValue: string
        icon?: string
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
            <search className='px-4 rounded-xl text-on-surface flex gap-3 text-base font-normal py-2'
                style={{backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})`}}
            >
                {icon && <Icon icon={icon} />}
                <input type='search' placeholder={placeholder} onClick={e => e.preventDefault()} onChange={event => setValue(event.currentTarget.value)} value={value} className={`cursor-text bg-transparent min-w-32 w-full outline-none text-left`} />
                {value != defaultValue && <MinimalIconButton icon='close' onClick={_ => {setValue(defaultValue)}}/>}
            </search>
        </FilterElement>
    )
}