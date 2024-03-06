'use client'
export const dateFormatter = new Intl.DateTimeFormat()
export const shortenedDateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'numeric',
    day: '2-digit',
})

export function DateFormatter(
    {
        date,
        compact = false
    }: {
        date: Date
        compact?: boolean
    }
) {
    const formatter = compact ? shortenedDateFormatter : dateFormatter
    return (
        <time dateTime={date.toISOString()}>
            {formatter.format(date)}
        </time>
    )
}