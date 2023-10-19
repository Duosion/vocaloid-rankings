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
        <section className="flex md:flex-col flex-row md:max-w-[300px] flex-1 gap-3 h-fit md:items-start items-center md:py-0 md:px-0 py-2 px-4 rounded-xl box-border cursor-pointer select-none" onClick={() => setValue(value == 0 ? 1 : 0)}>
            <h3 className="text-on-surface flex-1 md:font-bold md:text-lg text-base">{name}</h3>
            <div className="flex gap-3 items-center w-fit font-normal cursor-pointer select-none" >
                <h3 className="text-base text-on-surface">{options[0]}</h3>
                <Switch selected={value == 1} />
                <h3 className="text-base text-on-surface">{options[1]}</h3>
            </div>
        </section>
    )
}