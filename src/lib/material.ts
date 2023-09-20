import { MaterialDynamicColors, Scheme, SchemeContent, hexFromArgb } from "@material/material-color-utilities";

const tonalSurfaceContainers = {
    'surface-container-lowest': MaterialDynamicColors.surfaceContainerLowest,
    'surface-container-low': MaterialDynamicColors.surfaceContainerLow,
    'surface-container': MaterialDynamicColors.surfaceContainer,
    'surface-container-high': MaterialDynamicColors.surfaceContainerHigh,
    'surface-container-highest': MaterialDynamicColors.surfaceContainerHighest
}

// theme generation helper functions
export const getCustomThemeStylesheet = (
    theme: Scheme,
    dynamicScheme: SchemeContent
) => {

    const lines = []

    for (const [key, argb] of Object.entries(theme.toJSON())) {
        if (key != 'background') {
            const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            const color = hexFromArgb(argb);
            lines.push(`--md-sys-color-${token}: ${color} !important;`)
        }
    }
    // add tonal surface container values
    for (const key in tonalSurfaceContainers) {
        const dynamicColor = tonalSurfaceContainers[key as keyof typeof tonalSurfaceContainers]
        lines.push(`--md-sys-color-${key}: ${hexFromArgb(dynamicColor.getArgb(dynamicScheme))} !important;`)
    }

    return lines
}