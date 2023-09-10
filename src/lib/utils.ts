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