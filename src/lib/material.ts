import { DynamicColor, DynamicScheme, MaterialDynamicColors, Scheme, SchemeContent, hexFromArgb } from "@material/material-color-utilities";
import { Palette } from "color-thief-node";

const tonalSurfaceContainers = {
    'surface-container-lowest': MaterialDynamicColors.surfaceContainerLowest,
    'surface-container-low': MaterialDynamicColors.surfaceContainerLow,
    'surface-container': MaterialDynamicColors.surfaceContainer,
    'surface-container-high': MaterialDynamicColors.surfaceContainerHigh,
    'surface-container-highest': MaterialDynamicColors.surfaceContainerHighest
}

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

// gets the most vibrant color from a list of rgb colors.
export const getMostVibrantColor = (
    colors: Palette[]
): Palette | null => {
    let maxVibrancy = -1;
    let vibrantColor = null;

    for (const color of colors) {
        const vibrancy = Math.max(...color) - Math.min(...color);

        if (vibrancy > maxVibrancy) {
            maxVibrancy = vibrancy;
            vibrantColor = color;
        }
    }

    return vibrantColor;
}