import { getSong } from '@/data/songsData'
import { Entity, NameType, Names, Song, SongVideoIds, SourceType, ViewsBreakdown } from '@/data/types'
import {
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLObjectType,
    GraphQLSchema
} from 'graphql'

/**
 * SCHEMA OVERVIEW
 * 
 * ```graphql
 * enum SongType { ORIGINAL, REMIX, OTHER }
 * 
 * enum SourceType { YOUTUBE, NICONICO, BILIBILI }
 * 
 * enum ArtistType { VOCALOID, CEVIO, SYNTHESIZER_V, ILLUSTRATOR, COVER_ARTIST, ANIMATOR, PRODUCER, OTHER_VOCALIST, OTHER_VOICE_SYNTHESIZER, OTHER_INDIVIDUAL, OTHER_GROUP, UTAU }
 * 
 * enum ArtistCategory { VOCALIST, PRODUCER }
 * 
 * enum ArtistThumbnailType { ORIGINAL, MEDIUM, SMALL, TINY }
 * 
 * type EntityNames {
 *   original: String!
 *   japanese: String
 *   english: String
 *   romaji: String
 * }
 * 
 * type SongVideoIds {
 *   youtube: [String]
 *   niconico: [String]
 *   bilibili: [String]
 * }
 * 
 * type VideoViews {
 *   id: String!
 *   views: Int!
 * }
 * 
 * type EntityViewsBreakdown {
 *   youtube: [VideoViews]
 *   niconico: [VideoViews]
 *   bilibili: [VideoViews]
 * }
 * 
 * type EntityViews {
 *   timestamp: String
 *   total: Int!
 *   breakdown: EntityViewsBreakdown
 * }
 * 
 * type SongPlacement {
 *   allTime: Int
 *   releaseYear: Int
 * }
 * 
 * type ArtistPlacement {
 *   allTime: Int
 * }
 * 
 * type ArtistThumbnail {
 *   type: ArtistThumbnailType
 *   url: String
 * }
 * 
 * interface Entity {
 *   id: Int!
 *   publishDate: String
 *   additionDate: String
 *   names: EntityNames
 *   views: EntityViews
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 * }
 * 
 * type Artist implements Entity {
 *   id: Int!
 *   type: ArtistType
 *   category: ArtistCategory
 *   publishDate: String
 *   additionDate: String
 *   names: EntityNames
 *   thumbnails: [ArtistThumbnail]
 *   baseArtist: Artist
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 *   views: EntityViews
 *   placement: ArtistPlacement 
 * }
 * 
 * type Song implements Entity {
 *   id: Int!
 *   publishDate: String
 *   additionDate: String
 *   type: SongType
 *   thumbnail: String
 *   maxresThumbnail: String
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 *   artists: [Artist]
 *   names: Entitynames
 *   videoIds: SongVideoIds
 *   views: EntityViews
 *   placement: SongPlacement
 *   thumbnailType: SourceType
 * }
 * 
 * type Query {
 *   song(id: Int!): Song
 *   artist(id: Int!): Artist
 * }
 * 
 * ```
 */

// create enums

/**
 * enum SongType { ORIGINAL, REMIX, OTHER }
 */
const songTypeEnum = new GraphQLEnumType({
    name: 'SongType',
    description: 'The type of the song.',
    values: {
        ORIGINAL: {
            value: 0,
            description: 'An original song.'
        },
        REMIX: {
            value: 1,
            description: 'A song that is a remix of another.'
        },
        OTHER: {
            value: 2,
            description: 'A song that does not fit in any other category.'
        }
    }
})

/**
 * enum SourceType { YOUTUBE, NICONICO, BILIBILI }
 */
const sourceTypeEnum = new GraphQLEnumType({
    name: 'SourceType',
    description: 'Describes where a video originates from.',
    values: {
        YOUTUBE: {
            value: 0,
            description: 'A video that originates from YouTube.'
        },
        NICONICO: {
            value: 1,
            description: 'A video that originates from Niconico douga.'
        },
        BILIBILI: {
            value: 2,
            description: 'A video from bilibili.'
        }
    }
})

/**
 * enum ArtistType { VOCALOID, CEVIO, SYNTHESIZER_V, ILLUSTRATOR, COVER_ARTIST, ANIMATOR, PRODUCER, OTHER_VOCALIST, OTHER_VOICE_SYNTHESIZER, OTHER_INDIVIDUAL, OTHER_GROUP, UTAU }
 */
const artistTypeEnum = new GraphQLEnumType({
    name: 'ArtistType',
    description: "Describes an artist's type.",
    values: {
        VOCALOID: {
            value: 0,
            description: 'A Vocaloid voicebank.'
        },
        CEVIO: {
            value: 1,
            description: 'A CeVIO AI voicebank.'
        },
        SYNTHESIZER_V: {
            value: 2,
            description: 'A Synthesizer V voicebank.'
        },
        ILLUSTRATOR: {
            value: 3
        },
        COVER_ARTIST: {
            value: 4,
            description: "An artist that created a song's cover."
        },
        ANIMATOR: {
            value: 5
        },
        PRODUCER: {
            value: 6,
            description: 'An individual responsible for the production of a song.'
        },
        OTHER_VOCALIST: {
            value: 7,
            description: 'A vocalist who is not a vocal synthesizer.'
        },
        OTHER_VOICE_SYNTHESIZER: {
            value: 8,
            description: 'An unspecified vocal synthesizer.'
        },
        OTHER_INDIVIDUAL: {
            value: 9
        },
        OTHER_GROUP: {
            value: 10
        },
        UTAU: {
            value: 11,
            description: 'A voicebank created with the UTAU program.'
        }
    }
})

/**
 * enum ArtistCategory { VOCALIST, PRODUCER }
 */
const artistCategoryEnum = new GraphQLEnumType({
    name: 'ArtistCategory',
    description: 'Is this artist a vocalist or producer?',
    values: {
        VOCALIST: {
            value: 0
        },
        PRODUCER: {
            value: 1
        }
    }
})

/**
 * enum ArtistThumbnailType { ORIGINAL, MEDIUM, SMALL, TINY }
 */
const artistThumbnailTypeEnum = new GraphQLEnumType({
    name: 'ArtistThumbnailType',
    description: "Roughly indicates the resoultion of an artist's thumbnail.",
    values: {
        ORIGINAL: {
            value: 0
        },
        MEDIUM: {
            value: 1
        },
        SMALL: {
            value: 2
        },
        TINY: {
            value: 3
        }
    }
})


// Interfaces & Types

/**
 * type EntityNames {
 *   original: String!
 *   japanese: String
 *   english: String
 *   romaji: String
 * }
 */
const entityNamesType = new GraphQLObjectType({
    name: 'EntityNames',
    description: "Contains all of an entity's different names.",
    fields: {
        original: {
            type: new GraphQLNonNull(GraphQLString),
            description: "The entity's original name.",
            resolve: (names: Names) => names[NameType.ORIGINAL]
        },
        japanese: {
            type: GraphQLString,
            description: "The entity's Japanese name.",
            resolve: (names: Names) => names[NameType.JAPANESE]
        },
        english: {
            type: GraphQLString,
            description: "The entity's English name.",
            resolve: (names: Names) => names[NameType.ENGLISH]
        },
        romaji: {
            type: GraphQLString,
            description: "The entity's Japanese name romanized.",
            resolve: (names: Names) => names[NameType.ROMAJI]
        }
    }
})

/**
 * type SongVideoIds {
 *   youtube: [String]
 *   niconico: [String]
 *   bilibili: [String]
 * }
 */
const songVideoIdsType = new GraphQLObjectType({
    name: 'SongVideoIds',
    description: "Contains all of a song's video's ids from YouTube, Niconico, and bilibili.",
    fields: {
        youtube: {
            type: new GraphQLList(GraphQLString),
            description: "All of song's YouTube videos' ids.",
            resolve: (ids: SongVideoIds) => ids[SourceType.YOUTUBE]
        },
        niconico: {
            type: new GraphQLList(GraphQLString),
            description: "All of song's Niconico videos' ids.",
            resolve: (ids: SongVideoIds) => ids[SourceType.NICONICO]
        },
        bilibili: {
            type: new GraphQLList(GraphQLString),
            description: "All of song's bilibili videos' ids.",
            resolve: (ids: SongVideoIds) => ids[SourceType.BILIBILI]
        }
    }
})

/**
 * type VideoViews {
 *   id: String!
 *   views: Int!
 * }
 */
const videoViewsType = new GraphQLObjectType({
    name: 'VideoViews',
    description: 'The amount of views a specific video has.',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The id of the video.'
        },
        views: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The amount of views the video has.'
        }
    }
})

/**
 * type EntityViewsBreakdown {
 *   youtube: [VideoViews]
 *   niconico: [VideoViews]
 *   bilibili: [VideoViews]
 * }
 */
const entityViewsBreakdownType = new GraphQLObjectType({
    name: 'EntityViewsBreakdown',
    description: 'A breakdown of the views an entity has by source.',
    fields: {
        youtube: {
            type: new GraphQLList(videoViewsType),
            description: 'All of the views from YouTube that a song has.',
            resolve: (breakdown: ViewsBreakdown) => breakdown[SourceType.YOUTUBE]
        },
        niconico: {
            type: new GraphQLList(videoViewsType),
            description: 'All of the views from Niconico that a song has.',
            resolve: (breakdown: ViewsBreakdown) => breakdown[SourceType.NICONICO]
        },
        bilibili: {
            type: new GraphQLList(videoViewsType),
            description: 'All of the views from bilibili that a song has.',
            resolve: (breakdown: ViewsBreakdown) => breakdown[SourceType.BILIBILI]
        }
    }
})

/**
 * type EntityViews {
 *   timestamp: String
 *   total: Int!
 *   breakdown: EntityViewsBreakdown
 * }
 */
const entityViewsType = new GraphQLObjectType({
    name: 'EntityViews',
    description: 'Describes the views that an entity has.',
    fields: {
        timestamp: {
            type: GraphQLString,
            description: 'The timestamp of when these view counts were calculated.'
        },
        total: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The total amount of views a song has.'
        },
        breakdown: {
            type: entityViewsBreakdownType,
            description: 'A breakdown of the total amount of views a song has by source.'
        }
    }
})

/**
 * type SongPlacement {
 *   allTime: Int
 *   releaseYear: Int
 * }
 */
const songPlacementType = new GraphQLObjectType({
    name: 'SongPlacement',
    description: "A song's placement in various categories.",
    fields: {
        allTime: {
            type: GraphQLInt,
            description: 'What placement a song has in all time based on views.'
        },
        releaseYear: {
            type: GraphQLInt,
            description: 'What placement a song has within its release year based on views.'
        }
    }
})

/**
 * type ArtistPlacement {
 *   allTime: Int
 * }
 */
const artistObjectInterface = new GraphQLObjectType({
    name: 'ArtistPlacement',
    description: "An artist's placement in various categories.",
    fields: {
        allTime: {
            type: GraphQLInt,
            description: 'What placement a artist has in all time based on views.'
        }
    }
})

/**
 * type ArtistThumbnail {
 *   type: ArtistThumbnailType
 *   url: String
 * }
 */
const artistThumbnailType = new GraphQLObjectType({
    name: 'ArtistThumbnail',
    description: 'The thumbnail of an artist.',
    fields: {
        type: {
            type: artistThumbnailTypeEnum,
            description: 'The type of the thumbnail.'
        },
        url: {
            type: GraphQLString,
            description: 'The URL of the thumbnail.'
        }
    }
})

/**
 * interface Entity {
 *   id: Int!
 *   publishDate: String
 *   additionDate: String
 *   names: EntityNames
 *   views: EntityViews
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 * }
 */

const entityInterface = new GraphQLInterfaceType({
    name: 'Entity',
    description: 'An entity that can be a Song or an Artist.',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The ID of the entity.'
        },
        publishDate: {
            type: GraphQLString,
            description: 'When the entity was first published (for songs) or released (for voicebanks/artists).'
        },
        additionDate: {
            type: GraphQLString,
            description: 'When the entity was added to the database.'
        },
        names: {
            type: entityNamesType,
            description: 'The names that an entity has.'
        },
        views: {
            type: entityViewsType,
            description: 'Describes the views that an entity has.'
        },
        averageColor: {
            type: GraphQLString,
            description: 'An HTML color of the average color of the thumbnail of an entity.'
        },
        darkColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a dark theme.'
        },
        lightColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a light theme.'
        }
    }
})


// types

/** 
 * type Artist implements Entity {
 *   id: Int!
 *   type: ArtistType
 *   category: ArtistCategory
 *   publishDate: String
 *   additionDate: String
 *   names: EntityNames
 *   thumbnails: [ArtistThumbnail]
 *   baseArtist: Artist
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 *   views: EntityViews
 *   placement: ArtistPlacement 
 * }
 */
const artistType: GraphQLObjectType = new GraphQLObjectType({
    name: 'Artist',
    description: 'An artist involved in one or more songs.',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The ID of the artist.'
        },
        type: {
            type: artistTypeEnum,
            description: 'The type of the artist.'
        },
        category: {
            type: artistCategoryEnum,
            description: 'The role of the artist.'
        },
        publishDate: {
            type: GraphQLString,
            description: 'When the artist was first published (for songs) or released (for voicebanks/artists).'
        },
        additionDate: {
            type: GraphQLString,
            description: 'When the artist was added to the database.'
        },
        names: {
            type: entityNamesType,
            description: 'The names that the artist has.'
        },
        thumbnails: {
            type: new GraphQLList(artistThumbnailType),
            description: 'The thumbnails of the artist.'
        },
        averageColor: {
            type: GraphQLString,
            description: 'An HTML color of the average color of the thumbnail of an artist.'
        },
        darkColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a dark theme.'
        },
        lightColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a light theme.'
        },
        views: {
            type: entityViewsType,
            description: 'Describes the views that the artist has.'
        },
        placement: {
            type: artistObjectInterface,
            description: 'The placement of the artist in various categories.'
        }
    },
    interfaces: [entityInterface]
})

/**
 * type Song implements Entity {
 *   id: Int!
 *   publishDate: String
 *   additionDate: String
 *   type: SongType
 *   thumbnail: String
 *   maxresThumbnail: String
 *   averageColor: String
 *   darkColor: String
 *   lightColor: String
 *   artists: [Artist]
 *   names: Entitynames
 *   videoIds: SongVideoIds
 *   views: EntityViews
 *   placement: SongPlacement
 *   thumbnailType: SourceType
 * }
 */
const songType: GraphQLObjectType = new GraphQLObjectType({
    name: 'Song',
    description: 'An song involved in one or more songs.',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The ID of the song.'
        },
        publishDate: {
            type: GraphQLString,
            description: 'When the artist was first published (for songs) or released (for voicebanks/artists).'
        },
        additionDate: {
            type: GraphQLString,
            description: 'When the artist was added to the database.'
        },
        type: {
            type: songTypeEnum,
            description: 'The type of the song.'
        },
        thumbnail: {
            type: GraphQLString,
            description: 'The lower-quality thumbnail URL of the song.'
        },
        maxresThumbnail: {
            type: GraphQLString,
            description: 'The higher-quality thumbnail URL of the song.'
        },
        averageColor: {
            type: GraphQLString,
            description: 'An HTML color of the average color of the thumbnail of the song.'
        },
        darkColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a dark theme.'
        },
        lightColor: {
            type: GraphQLString,
            description: 'An HTML color that is a version of averageColor optimized for a light theme.'
        },
        artists: {
            type: new GraphQLList(artistType),
            description: 'The artists involved with the song.'
        },
        names: {
            type: entityNamesType,
            description: 'The names that the song has.'
        },
        videoIds: {
            type: songVideoIdsType,
            description: 'Every video id of a song.'
        },
        views: {
            type: entityViewsType,
            description: 'Describes the views that the song has.'
        },
        placement: {
            type: songPlacementType,
            description: 'The placement of the song in various categories.'
        },
        thumbnailType: {
            type: sourceTypeEnum,
            description: 'The source type that the thumbnail of the song originated from.'
        }
    },
    interfaces: [entityInterface]
})

/**
 * type Query {
 *   song(id: Int!): Song
 *   artist(id: Int!): Artist
 * }
 */
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        song: {
            type: songType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLInt),
                    description: 'The ID of the song.'
                }
            },
            resolve: (
                _source,
                { id }: { id: number }
            ) => getSong(id)
        },
        /*artist: {
            type: artistType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLInt),
                    description: 'The ID of the artist.'
                }
            },
            resolve: (
                _source,
                { id }: { id: number }
            ) => getArtist(id)
        }*/
    }
})

export const Schema: GraphQLSchema = new GraphQLSchema({
    query: queryType,
    types: [songType, artistType]
})