import { Elevation } from "./types";

export const elevationToClass: {[key in Elevation]: string} = {
    [Elevation.LOWEST]: 'surface-container-lowest',
    [Elevation.LOW]: 'surface-container-low',
    [Elevation.NORMAL]: 'surface-container',
    [Elevation.HIGH]: 'surface-container-high',
    [Elevation.HIGHEST]: 'surface-container-highest'
}