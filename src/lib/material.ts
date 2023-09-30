import { DynamicColor, DynamicScheme, MaterialDynamicColors, Scheme, SchemeContent, hexFromArgb } from "@material/material-color-utilities";

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