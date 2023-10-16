import { MutableRefObject } from "react"

export function timeoutDebounce(
    ref: MutableRefObject<NodeJS.Timeout | undefined>,
    timeout: number,
    callback: () => void
) {
    if (ref) {
        clearTimeout(ref.current)
    }

    ref.current = setTimeout(callback, timeout)
}

// takes an iso timestamp and converts it into a local date. (only the year, month, day part of the timestamp.)
export function localISOTimestampToDate(
    isoTimestamp: string
): Date | null {
    try {
        const split = isoTimestamp.split('-')

        const year = Number(split[0])
        const month = Number(split[1])
        const day = Number(split[2])

        return new Date(year, month - 1, day)
    } catch (error) {
        return null
    }
}

export const generateTimestamp = (
    date: Date = new Date()
): string => {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0')
}