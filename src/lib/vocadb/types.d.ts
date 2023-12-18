import { SourceType } from "@/data/types";
import { Platform } from "../platforms/types";

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

// artist within the VocaDBSong object.
export interface VocaDBSongArtist {
    artist: {
        id: number;
    }
    categories: string
}

export interface VocaDBSongPV {
    id: number;
    name: string;
    publishDate: string;
    pvId: string;
    service: string;
    pvType: string;
    url: string;
    disabled: booolean;
}

export interface VocaDBSongLocalizedName {
    language: string;
    value: string;
}

export interface VocaDBSong {
    artists: VocaDBSongArtist[]
    createDate: string;
    defaultName: string;
    defaultNameLanguage: Language;
    id: number;
    name: string;
    names: VocaDBSongLocalizedName[];
    publishDate: string;
    pvs: VocaDBSongPV[];
    songType: SongType;
}

export interface VocaDBSourcePoller extends Platform {
    dataName: string
    type: SourceType
    idPrefix?: string
}