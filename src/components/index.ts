import { CSSProperties } from "react"

export enum Elevation {
    LOWEST,
    LOW,
    NORMAL,
    HIGH,
    HIGHEST
}

export enum ImageDisplayMode {
    SONG,
    VOCALIST,
    PRODUCER
}

export const elevationToClass: {[key in Elevation]: string} = {
    [Elevation.LOWEST]: 'surface-container-lowest',
    [Elevation.LOW]: 'surface-container-low',
    [Elevation.NORMAL]: 'surface-container',
    [Elevation.HIGH]: 'surface-container-high',
    [Elevation.HIGHEST]: 'surface-container-highest'
}

export const imageDisplayModeStyles: { [key in ImageDisplayMode]: CSSProperties } = {
    [ImageDisplayMode.SONG]: {
        transform: 'scaleX(1.45) scaleY(1.45)',
        objectPosition: 'center center'
    },
    [ImageDisplayMode.VOCALIST]: {
        objectPosition: 'center top'
    },
    [ImageDisplayMode.PRODUCER] : {
        objectPosition: 'center center'
    }
}