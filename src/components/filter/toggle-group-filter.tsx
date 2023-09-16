enum ToggleStatus {
    INCLUDED,
    EXCLUDED
}

export function ToggleGroupFilterElement(
    {
        name,
        included,
        excluded,
        options,
        onValueChanged
    }: {
        name: string,
        included: number[],
        excluded: number[],
        options: string[],
        onValueChanged?: (included: number[], excluded: number[]) => void
    }
) {
    // build the status map
    const statusMap: { [key: string]: ToggleStatus } = {}
    included.forEach(option => {
        statusMap[options[option]] = ToggleStatus.INCLUDED
    })
    excluded.forEach(option => {
        statusMap[options[option]] = ToggleStatus.EXCLUDED
    })

    return (
        <section>
            <h3 className="text-on-background text-lg mb-2">{name}</h3>
            <ul className="flex gap-2 flex-wrap items-start">{options.map((option, num) => {
                const status: ToggleStatus | undefined = statusMap[option]
                return status == ToggleStatus.INCLUDED ? (
                    <li key={num}><button className={'px-3 py-1 rounded-lg box-border border border-inverse-surface bg-inverse-surface text-inverse-on-surface'} onClick={e => { 
                        e.preventDefault() // prevent default
                        excluded.push(num)
                        included.splice(included.indexOf(num), 1)
                        if (onValueChanged) onValueChanged(included, excluded) // call on value changed
                    }}>{option}</button></li>
                ) : status == ToggleStatus.EXCLUDED ? (
                    <li key={num}><button className={'px-3 py-1 rounded-lg box-border border border-error bg-error text-on-error'} onClick={e => { 
                        e.preventDefault() // prevent default
                        excluded.splice(excluded.indexOf(num), 1)
                        if (onValueChanged) onValueChanged(included, excluded) // call on value changed
                    }}>{option}</button></li>
                ) : (
                    <li key={num}><button className={'px-3 py-1 rounded-lg box-border border border-on-background text-on-background'} onClick={e => {
                        e.preventDefault() // prevent default
                        included.push(num)
                        if (onValueChanged) onValueChanged(included, excluded)  // call on value changed
                    }}>{option}</button></li>
                )
            })}</ul>
        </section>
    )
}