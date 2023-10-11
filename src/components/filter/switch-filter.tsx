import { Switch } from "../material/switch"

export function SwitchFilterElement(
    {
        name,
        value,
        onValueChanged
    }: {
        name: string
        value: boolean
        onValueChanged?: (newValue: boolean) => void
    }
) {
    function setValue(newValue: boolean) {
        if (value != newValue && onValueChanged) onValueChanged(newValue)
    }

    return (
        <section className="flex flex-1 gap-3 h-fit items-center py-2 px-4 rounded-xl box-border cursor-pointer select-none" onClick={() => setValue(!value)}>
            <h3 className="text-base text-on-surface flex-1">{name}</h3>
            <Switch selected={value} />
        </section>
    )
}