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
        <section className="flex md:flex-col flex-row md:max-w-[300px] flex-1 gap-3 h-fit md:items-start items-center md:py-0 md:px-0 py-2 px-4 rounded-xl box-border cursor-pointer select-none" onClick={() => setValue(!value)}>
            <h3 className="text-on-surface flex-1 md:font-bold md:text-lg text-base">{name}</h3>
            <Switch selected={value} />
        </section>
    )
}