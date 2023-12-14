import { NumberFormatter } from "../formatters/number-formatter";
import { DateFormatter } from "../formatters/date-formatter";
import { FilterOrder } from "@/data/types";
import { YearsSinceFormatter } from "../formatters/years-since-formatter";

export enum RankingsItemTrailingMode {
    VIEWS,
    SONG_COUNT,
    PUBLISH_DATE,
    ADDITION_DATE,
    YEARS_SINCE_PUBLISH
}

export function RankingsItemTrailing(
    {
        mode,
        value,
        publishDate,
        additionDate,
        compact = false
    }: {
        mode: RankingsItemTrailingMode | FilterOrder,
        value: number,
        publishDate?: string,
        additionDate?: string,
        compact?: boolean
    }
) {
    switch(mode) {
        case RankingsItemTrailingMode.VIEWS:
        case RankingsItemTrailingMode.SONG_COUNT:
            return <NumberFormatter number={value} compact={compact}/>;
        case RankingsItemTrailingMode.PUBLISH_DATE:
            return publishDate ? <DateFormatter date={new Date(publishDate)} compact={compact}/> : undefined;
        case RankingsItemTrailingMode.ADDITION_DATE:
            return additionDate ? <DateFormatter date={new Date(additionDate)} compact={compact}/> : undefined;
        case RankingsItemTrailingMode.YEARS_SINCE_PUBLISH:
            return publishDate ? <YearsSinceFormatter date={new Date(publishDate)}/> : undefined;
        default:
            return undefined
    }
}