import { Elevation } from "@/material/types"
import { SelectFilterElement } from "./select-filter"

export function NumberSelectFilterElement(
    {
        name,
        value,
        defaultValue,
        start,
        end,
        placeholder,
        increment = 1,
        elevation = Elevation.LOW,
        modalElevation = Elevation.NORMAL,
        reverse = false,
        onValueChanged
    }: {
        name: string
        value: number
        defaultValue: number
        start: number
        end: number
        placeholder?: string,
        increment?: number
        elevation?: Elevation
        modalElevation?: Elevation
        reverse?: boolean
        onValueChanged?: (newValue?: number) => void
    }
) {

    // generate the options
    const options: string[] = []
    const optionsReverseMap: number[] = [] // takes an option index and returns the correct value
    let currentOption: number = defaultValue

    

    if (placeholder) {
        optionsReverseMap.push(-1)
        options.push(placeholder)
    }

    let index = 0
    for (let i = start; i < end; i += increment) {
        const num = reverse ? end - (index + 1) : i
        optionsReverseMap.push(num)
        options.push(String(num))
        if (num == value) currentOption = (placeholder ? index + 1 : index);
        index++
    }

    return (
        <SelectFilterElement
            searchable
            name={name}
            value={currentOption}
            defaultValue={defaultValue}
            options={options}
            elevation={elevation}
            modalElevation={modalElevation}
            onValueChanged={newValue => {
                if (onValueChanged) onValueChanged(newValue == 0 && placeholder ? undefined : optionsReverseMap[newValue])
            }}
        />
    )

}