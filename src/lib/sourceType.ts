import { SourceType } from "@/data/types"

// source type display data
export interface SourceTypeDisplayData {
    color: string,
    textColor: string,
    videoURL: string,
    icon: string
}
export const SourceTypesDisplayData: { [key in SourceType]: SourceTypeDisplayData } = {
    [SourceType.YOUTUBE]: {
        color: '#ff0000',
        textColor: '#ffffff',
        videoURL: 'https://www.youtube.com/watch?v=',
        icon: '/yt_icon.png'
    },
    [SourceType.NICONICO]: {
        color: 'var(--md-sys-color-on-surface)',
        textColor: 'var(--md-sys-color-surface)',
        videoURL: 'https://www.nicovideo.jp/watch/',
        icon: '/nico_icon.png'
    },
    [SourceType.BILIBILI]: {
        color: '#079fd2',
        textColor: '#ffffff',
        videoURL: 'https://www.bilibili.com/video/',
        icon: '/bili_icon.png'
    },
}