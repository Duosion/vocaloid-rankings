'use client'

import { shortenedDateFormatter } from "@/components/formatters/date-formatter"
import { shortenedNumberFormatter } from "@/components/formatters/number-formatter"
import { HistoricalViewsResult } from "@/data/types"
import { LineChart } from "@mui/x-charts"
import { DatasetElementType } from "@mui/x-charts/models/seriesType/config"

export function SongViewsChart(
    {
        historicalViewsResult
    }: {
        historicalViewsResult: HistoricalViewsResult
    }
) {
    const data = historicalViewsResult.views.map(views => views.views) as number[]
    const dates = historicalViewsResult.views.map(views => { return {date: new Date(views.timestamp)} as DatasetElementType<Date>})

    return (
        <LineChart
            xAxis={[{ dataKey: 'date', valueFormatter: (time: number) => shortenedDateFormatter.format(new Date(time)), min: new Date('2024-02-04'), max: new Date('2024-02-18') }]}
            yAxis={[{
                valueFormatter: (value: number) => shortenedNumberFormatter.format(value)
            }]}
            series={[
                {
                    data: data,
                    color: 'var(--md-sys-color-primary)'
                },
            ]}
            dataset={dates}
            height={200}
            tooltip={{
                classes: {
                    'root': 'bg-surface-container-high rounded-2xl border-outline-variant backdrop-blur backdrop-saturate-200',
                },
            }}
            sx={{
                fontFamily: 'var(--font-inter)',
                '& .MuiChartsAxis-tickLabel': {
                    fill: 'var(--md-sys-color-on-background) !important',
                    fontFamily: 'var(--font-inter) !important'
                },
                '& .MuiChartsAxis-line': {
                    stroke: 'var(--md-sys-color-outline-variant) !important'
                },
                '& .MuiChartsAxis-tick': {
                    stroke: 'var(--md-sys-color-outline-variant) !important'
                }
            }}
            margin={{
                top: 10,
                left: 40,
                right: 10,
                bottom: 20
            }}
        />
    )
}