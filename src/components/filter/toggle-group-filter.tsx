import { FilterChip, FilterChipState } from "../material/filter-chip"
import { ToggleStatus } from "./types"

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
            <h3 className="text-on-background font-bold text-lg mb-2">{name}</h3>
            <ul className="flex gap-2 flex-wrap items-start">{options.map((option, num) => {
                const status: ToggleStatus | undefined = statusMap[option]
                return status == ToggleStatus.INCLUDED ? (
                    <li key={num}><FilterChip label={option} state={FilterChipState.SELECTED} onClick={e => {
                        e.preventDefault() // prevent default
                        excluded.push(num)
                        included.splice(included.indexOf(num), 1)
                        if (onValueChanged) onValueChanged(included, excluded) // call on value changed
                    }}></FilterChip></li>
                ) : status == ToggleStatus.EXCLUDED ? (
                    <li key={num}><FilterChip label={option} state={FilterChipState.NEGATE} onClick={e => {
                        e.preventDefault() // prevent default
                        excluded.splice(excluded.indexOf(num), 1)
                        if (onValueChanged) onValueChanged(included, excluded) // call on value changed
                    }}></FilterChip></li>
                ) : (
                    <li key={num}><FilterChip label={option} state={FilterChipState.UNSELECTED} onClick={e => {
                        e.preventDefault() // prevent default
                        included.push(num)
                        if (onValueChanged) onValueChanged(included, excluded)  // call on value changed
                    }}></FilterChip></li>
                )
            })}</ul>
        </section>
    )
}