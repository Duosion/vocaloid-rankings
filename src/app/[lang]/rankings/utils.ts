import { FilterOrder } from "@/data/types"
import { SelectFilterValue } from "./types"

export function encodeBoolean(
    bool: boolean
): number {
    return bool ? 1 : 0
}

export function decodeBoolean(
    num?: number
): boolean {
    return num == 1
}

export function encodeMultiFilter(
    values: number[],
    separator: string = ','
): string {
    const builder = []
    for (const value of values) {
        if (!isNaN(value)) builder.push(value)
    }
    return builder.join(separator)
}

export function decodeMultiFilter(
    input?: string,
    separator: string = ','
): number[] {
    const output: number[] = []

    input?.split(separator).map(rawValue => {
        const parsed = Number(rawValue)
        if (!isNaN(parsed)) {
            output.push(parsed)
        }
    })

    return output
}

export function parseParamSelectFilterValue(
    paramValue: number | undefined,
    values: SelectFilterValue<number>[],
    defaultValue?: number
): number | null {
    // get the filterValue and return it
    const valueNumber = (paramValue == undefined || isNaN(paramValue)) ? (defaultValue == undefined || isNaN(defaultValue)) ? null : defaultValue : paramValue
    return valueNumber != null ? (values[valueNumber]).value : null
}

export function getRankingsItemTrailingSupportingText(
    mode: FilterOrder,
    views?: string,
    songCount?: string,
    publishDate?: string,
    additionDate?: string
): string | undefined {
    switch (mode) {
        case FilterOrder.VIEWS:
            return views
        case FilterOrder.SONG_COUNT:
            return songCount;
        case FilterOrder.PUBLISH_DATE:
            return publishDate;
        case FilterOrder.ADDITION_DATE:
            return additionDate
        default:
            return undefined
    }
}