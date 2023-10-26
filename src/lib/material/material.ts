import { DynamicColor, DynamicScheme, MaterialDynamicColors, hexFromArgb } from "@material/material-color-utilities";
//import { Palette, getPaletteFromURL } from "color-thief-node";
import { Elevation, ImageDisplayMode } from "./types";
import { CSSProperties } from "react";

// theme generation helper functions
export const getCustomThemeStylesheet = (
    scheme: DynamicScheme
) => {

    const lines = []

    for (const key in MaterialDynamicColors) {
        const dynamicColor = MaterialDynamicColors[key as keyof typeof MaterialDynamicColors]
        if (dynamicColor instanceof DynamicColor) {
            lines.push(`--md-sys-color-${key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}: ${hexFromArgb(dynamicColor.getArgb(scheme))} !important;`)
        }
    }

    return lines
}

// Function to calculate the Euclidean distance between two colors
/*const colorDistance = (
    color1: Palette,
    color2: Palette
) => {
    return Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
}

// gets the most vibrant color from a list of rgb colors.
export const getMostVibrantColor = (
    colors: Palette[],
    averageColor?: Palette
): Palette => {
    let maxVibrancy = -1;
    let vibrantColor;

    for (const color of colors) {
        const vibrancy = Math.max(...color) - Math.min(...color);
        // if averageColor was provided, take it into account. Otherwise, just use the vibrancy as a score.
        const score = averageColor == undefined ? vibrancy : (vibrancy + (765 - colorDistance(color, averageColor)))
        if (score > maxVibrancy) {
            maxVibrancy = score;
            vibrantColor = color;
        }
    }

    return vibrantColor || colors[0];
}

export const getImageMostVibrantColor = (
    imageUrl: string
): Promise<Palette> => {
    return new Promise<Palette>((resolve, reject) => {
        getPaletteFromURL(imageUrl)
            .then(palette => {
                resolve(getMostVibrantColor(palette))
            })
            .catch(error => reject(error))
    })
}*/

export const elevationToClass: {[key in Elevation]: string} = {
    [Elevation.LOWEST]: 'surface-container-lowest',
    [Elevation.LOW]: 'surface-container-low',
    [Elevation.NORMAL]: 'surface-container',
    [Elevation.HIGH]: 'surface-container-high',
    [Elevation.HIGHEST]: 'surface-container-highest'
}

export const imageDisplayModeStyles: { [key in ImageDisplayMode]: CSSProperties } = {
    [ImageDisplayMode.SONG]: {
        transform: 'scaleX(1.5) scaleY(1.5)',
        objectPosition: 'center center'
    },
    [ImageDisplayMode.VOCALIST]: {
        objectPosition: 'center top'
    },
    [ImageDisplayMode.PRODUCER] : {
        objectPosition: 'center center'
    }
}