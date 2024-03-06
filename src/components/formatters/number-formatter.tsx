'use client'
export const numberFormatter = new Intl.NumberFormat()
export const shortenedNumberFormatter = new Intl.NumberFormat(undefined, {
    notation: 'compact'
})

export function NumberFormatter(
    {
        number,
        compact = false
    }: {
        number: number
        compact?: boolean
    }
) {
return compact ? (
        <span title={numberFormatter.format(number)}>{shortenedNumberFormatter.format(number)}</span>
    ) : (
        numberFormatter.format(number)
    )
}