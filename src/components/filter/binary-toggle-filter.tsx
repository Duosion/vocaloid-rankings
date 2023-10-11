import { Switch } from "../material/switch"
import { FilterElement } from "./filter"

export function BinaryToggleFilterElement(
    {
        name,
        options,
        value,
        defaultValue,
        onValueChanged
    }: {
        name: string
        options: string[]
        value: number
        defaultValue: number
        onValueChanged?: (newValue: number) => void
    }
) {
    value = isNaN(value) ? defaultValue : value
    function setValue(newValue: number) {
        if (value != newValue && onValueChanged) onValueChanged(newValue)
    }

    return (
        <FilterElement key={name} name={name} shrink>
            <div className="flex gap-3 items-center w-fit font-normal cursor-pointer select-none" onClick={() => setValue(value == 0 ? 1 : 0)}>
                <h3 className="text-base text-on-surface">{options[0]}</h3>
                <Switch selected={value == 1} />
                <h3 className="text-base text-on-surface">{options[1]}</h3>
            </div>
        </FilterElement>
    )
}