import { ArtistCategory, ArtistType } from "@/data/types"
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

export const buildFuzzyDate = (
    year?: string,
    month?: string,
    day?: string
): string => {
    const fuzzyYear = !year || isNaN(Number(year)) ? '%' : year
    const fuzzyMonth = !month || isNaN(Number(month)) ? '%' : month.padStart(2, '0')
    const fuzzyDay = !day || isNaN(Number(day)) ? '%' : day.padStart(2, '0')
    return `${fuzzyYear}-${fuzzyMonth}-${fuzzyDay}%`
}

export function mapArtistTypeToCategory(
    type: ArtistType
): ArtistCategory {
    switch (type) {
        case ArtistType.VOCALOID:
        case ArtistType.CEVIO:
        case ArtistType.SYNTHESIZER_V:
        case ArtistType.OTHER_VOCALIST:
        case ArtistType.OTHER_VOICE_SYNTHESIZER:
        case ArtistType.UTAU:
            return ArtistCategory.VOCALIST
        default:
            return ArtistCategory.PRODUCER
    }
}

export const artistCategoryToApiArtistTypes: { [key in ArtistCategory]: string[] } = {
    [ArtistCategory.VOCALIST]: [
        ArtistType[ArtistType.VOCALOID],
        ArtistType[ArtistType.CEVIO],
        ArtistType[ArtistType.SYNTHESIZER_V],
        ArtistType[ArtistType.OTHER_VOCALIST],
        ArtistType[ArtistType.OTHER_VOICE_SYNTHESIZER],
        ArtistType[ArtistType.UTAU],
    ],
    [ArtistCategory.PRODUCER]: [
        ArtistType[ArtistType.ILLUSTRATOR],
        ArtistType[ArtistType.COVER_ARTIST],
        ArtistType[ArtistType.ANIMATOR],
        ArtistType[ArtistType.PRODUCER],
        ArtistType[ArtistType.OTHER_INDIVIDUAL],
        ArtistType[ArtistType.OTHER_GROUP]
    ]
}