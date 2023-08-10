import { ArtistType, NameType, SongType, SourceType } from "@/data/types";
import type { LanguageDictionaryKey } from ".";

export const NameTypeLocaleTokens: {[key in NameType]: LanguageDictionaryKey} = {
    [NameType.ORIGINAL]: 'name_type_original',
    [NameType.JAPANESE]: 'name_type_japanese',
    [NameType.ENGLISH]: 'name_type_english',
    [NameType.ROMAJI]: 'name_type_romaji'
}

export const ArtistTypeLocaleTokens: {[key in ArtistType]: LanguageDictionaryKey} = {
    [ArtistType.VOCALOID]: 'filter_artist_type_vocaloid',
    [ArtistType.CEVIO]: 'filter_artist_type_cevio',
    [ArtistType.SYNTHESIZER_V]: 'filter_artist_type_synth_v',
    [ArtistType.ILLUSTRATOR]: 'filter_artist_type_illustrator',
    [ArtistType.COVER_ARTIST]: 'filter_artist_type_cover_artist',
    [ArtistType.ANIMATOR]: 'filter_artist_type_animator',
    [ArtistType.PRODUCER]: 'filter_artist_type_producer',
    [ArtistType.OTHER_VOCALIST]: 'filter_artist_type_other_vocalist',
    [ArtistType.OTHER_VOICE_SYNTHESIZER]: 'filter_artist_type_other_voice_synth',
    [ArtistType.OTHER_INDIVIDUAL]: 'filter_artist_type_other_individual',
    [ArtistType.OTHER_GROUP]: 'filter_artist_type_other_group',
    [ArtistType.UTAU]: 'filter_artist_type_utau'
}

export const SongTypeLocaleTokens: {[key in SongType]: LanguageDictionaryKey} = {
    [SongType.ORIGINAL]: 'filter_song_type_original',
    [SongType.REMIX]: 'filter_song_type_remix',
    [SongType.OTHER]: 'filter_song_type_other'
}

export const SourceTypeLocaleTokens: {[key in SourceType]: LanguageDictionaryKey} = {
    [SourceType.YOUTUBE]: 'youtube',
    [SourceType.NICONICO]: 'niconico',
    [SourceType.BILIBILI]: 'bilibili'
}