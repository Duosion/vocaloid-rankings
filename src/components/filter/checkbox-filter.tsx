export function CheckboxFilterElement(
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
        <section className="flex gap-3 items-center">
            <input id={name} type='checkbox' checked={value} onChange={newValue => setValue(newValue.currentTarget.checked)} />
            <label htmlFor={name} className="text-lg text-on-background font-normal">{name}</label>
        </section>
    )
}