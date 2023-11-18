import { FilterOrder } from "@/data/types";
import { NumberFormatter } from "../formatters/number-formatter";
import { DateFormatter } from "../formatters/date-formatter";

export function RankingsItemTrailing(
    {
        mode,
        value,
        publishDate,
        additionDate,
        compact = false
    }: {
        mode: FilterOrder,
        value: number,
        publishDate?: string,
        additionDate?: string,
        compact?: boolean
    }
) {
    switch(mode) {
        case FilterOrder.VIEWS:
        case FilterOrder.SONG_COUNT:
            return <NumberFormatter number={value} compact={compact}/>;
        case FilterOrder.PUBLISH_DATE:
            return publishDate ? <DateFormatter date={new Date(publishDate)} compact={compact}/> : undefined;
        case FilterOrder.ADDITION_DATE:
            return additionDate ? <DateFormatter date={new Date(additionDate)} compact={compact}/> : undefined;
        default:
            return undefined
    }
}