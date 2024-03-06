import { Icon } from "../material/icon"
import { FilterElement } from "./filter"
import { MinimalIconButton } from "../material/minimal-icon-button"
import { Elevation, elevationToClass } from ".."

export function InputFilterElement(
    {
        value,
        placeholder,
        defaultValue,
        name,
        icon,
        elevation = Elevation.LOW,
        className = '',
        type = 'search',
        onValueChanged
    }: {

        value: string
        placeholder: string
        defaultValue: string
        name?: string
        icon?: string
        elevation?: Elevation
        className?: string
        type?: string
        onValueChanged?: (newValue: string) => void
    }
) {
    function setValue(newValue: string) {
        if (value != newValue && onValueChanged) {
            onValueChanged(newValue)
        }
    }

    const valueIsDefault = value === defaultValue

    return (
        <FilterElement key={name} name={name || ''} minimal={name == undefined} className={className}>
            <search className='px-4 rounded-full text-on-surface flex gap-3 text-base font-normal py-2'
                style={{ backgroundColor: `var(--md-sys-color-${elevationToClass[elevation]})` }}
            >
                {icon && <Icon icon={icon} />}
                <input
                    type={type}
                    placeholder={placeholder}
                    onClick={e => e.preventDefault()}
                    onChange={event => setValue(event.currentTarget.value)}
                    value={value}
                    className={`cursor-text bg-transparent min-w-32 w-full outline-none text-left ${valueIsDefault ? 'text-on-surface' : 'text-primary'}`}
                />
                {valueIsDefault ? undefined : <MinimalIconButton icon='close' onClick={_ => { setValue(defaultValue) }} />}
            </search>
        </FilterElement>
    )
}