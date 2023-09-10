import { FilterElement } from "./filter"

export function DateFilterElement(
    {
        name,
        value,
        min,
        max,
        onValueChanged
    }: {
        name: string
        value: string
        min?: string
        max?: string
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
            <search className="py-2 px-4 rounded-xl bg-surface-container-low text-on-surface flex gap-3 text-base font-normal">
                <input type='date' value={value} min={min} max={max} onChange={event => setValue(event.currentTarget.value)} className={`cursor-text bg-transparent min-w-fit w-32 outline-none text-left`} />
            </search>
        </FilterElement>
    )
}