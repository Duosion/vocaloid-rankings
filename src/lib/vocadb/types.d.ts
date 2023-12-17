interface VocaDBArtistThumbnails {
    mime: string;
    urlOriginal: string;
    urlSmallThumb: string;
    urlThumb: string;
    urlTinyThumb: string;
}

export interface VocaDBArtistName {
    language: string;
    value: string;
}

export interface VocaDBArtist {
    artistType: string;
    baseVoicebank?: VocaDBArtist;
    createDate: string;
    id: number;
    mainPicture: VocaDBArtistThumbnails
    name: string;
    names: VocaDBArtistName[];
    releaseDate: string;
}
