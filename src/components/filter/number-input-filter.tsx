import { FilterElement } from "./filter"
import { MinimalIconButton } from "../material/minimal-icon-button"
import { Elevation, elevationToClass } from ".."

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

    const valueIsDefault = value === defaultValue

    return (
        <FilterElement key={name} name={name}>
            <div className="w-full py-2 px-4 rounded-full bg-surface-container-low text-on-surface flex gap-3 text-base font-normal" onClick={e => e.preventDefault()}
                style={{backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})`}}
            >
                <input 
                type='search' 
                placeholder={placeholder} 
                onChange={event => setValue(event.currentTarget.value)} 
                value={value} 
                className={`flex-1 cursor-text bg-transparent w-32 outline-none text-left ${valueIsDefault ? 'text-on-surface' : 'text-primary font-semibold'}`} />
                {valueIsDefault ? undefined : <MinimalIconButton icon='close' onClick={_ => {setValue(defaultValue)}}/>}
            </div>
        </FilterElement>
    )
}