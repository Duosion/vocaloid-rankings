import { filterSongRankings, getArtist, getSong, searchArtists } from '@/data/songsData'
import { ArtistThumbnailType, ArtistThumbnails, FilterDirection, FilterOrder, NameType, Names, Song, SongRankingsFilterParams, SongVideoIds, SourceType, ViewsBreakdown } from '@/data/types'
import {
    GraphQLEnumType,
    GraphQLInterfaceType,
    GraphQLNonNull,
    GraphQLString,
    GraphQLInt,
    GraphQLList,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLScalarType,
    Kind,
    GraphQLBoolean
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
 * enum PlacementChange { UP, SAME, DOWN }
 * 
 * enum FilterOrder { VIEWS, PUBLISH_DATE, ADDITION_DATE, POPULARITY }
 * 
 * enum FilterDirection { DESCENDING, ASCENDING }
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
 *   views: Long!
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
 *   total: Long!
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
 * type ArtistThumbnails {
 *   original: String
 *   medium: String
 *   small: String
 *   tiny: String
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
 *   thumbnails: ArtistThumbnails
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
 * type SongRankingsFilterResultItem {
 *   placement: Int!
 *   change: PlacementChange
 *   previousPlacement: Int
 *   views: Long!
 *   song: Song
 * }
 * 
 * type SongRankingsFilterResult {
 *   totalCount: Int
 *   timestamp: String
 *   results: [SongRankingsFilterResultItem]
 * }
 * 
 * type Query {
 *   song(id: Int!): Song
 *   songs(ids: [Int]!): [Song] 
 * 
 *   artist(id: Int!): Artist
 *   artists(ids: [Int]!): [Artist]
 * 
 *   songRankings(
 *     timestamp: String
 *     timePeriodOffset: number
 *     changeOffset: number
 *     daysOffset: number
 *     includeSourceTypes: [SourceType]
 *     excludeSourceTypes: [SourceType]
 *     includeSongTypes: [SongType]
 *     excludeSongTypes: [SongType]
 *     includeArtistTypes: [ArtistType]
 *     excludeArtistTypes: [ArtistType]
 *     publishDate: String
 *     orderBy: FilterOrder
 *     direction: FilterDirection
 *     artists: [Int]
 *     songs: [Int]
 *     singleVideo: Boolean
 *     maxEntries: Int
 *     startAt: 0
 *     minViews: Long
 *     maxViews: Long
 *     search: String
 *   ): SongRankingsFilterResult
 *   
 *   searchArtists(
 *     query: String!
 *     maxEntries: Int
 *     startAt: Int
 *   ): [Artist]
 * }
 * 
 * ```
 */

// create scalar types
const longScalarType = new GraphQLScalarType({
    name: 'Long',
    description: 'Custom long scalar type.',
    serialize(value) {
        if (typeof value === 'number') return value
        throw new Error('GraphQL Long Scalar serializer expected a "string".')
    },
    parseValue(value) {
        if (typeof value === 'number') return value
        throw new Error('GraphQL Long Scalar parser expected a "bigint".')
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) return parseInt(ast.value)
        return null
    }
})

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
 * enum PlacementChange { UP, SAME, DOWN }
 */
const placementChangeEnum = new GraphQLEnumType({
    name: 'PlacementChange',
    description: `Describes how an entity's rankings placement has changed.`,
    values: {
        UP: {
            value: 0,
            description: `The entity's placement has increased since the last period.`
        },
        SAME: {
            value: 1,
            description: `The entity's placement has not changed since the last period.`
        },
        DOWN: {
            value: 2,
            description: `The entity's placement has decreased since the last period.`
        }
    }
})

/**
 * enum FilterOrder { VIEWS, PUBLISH_DATE, ADDITION_DATE, POPULARITY }
 */
const filterOrderEnum = new GraphQLEnumType({
    name: 'FilterOrder',
    description: `How to order entities in a rankings result.`,
    values: {
        VIEWS: {
            value: 0,
            description: `Order entities by their view counts.`
        },
        PUBLISH_DATE: {
            value: 1,
            description: `Order entities by their publish date.`
        },
        ADDITION_DATE: {
            value: 2,
            description: `Order entities by when they were added to the database..`
        },
        POPULARITY: {
            value: 3,
            description: `Order entities by their popularity.`
        }
    }
})

/**
 * enum FilterDirection { DESCENDING, ASCENDING }
 */
const filterDirectionEnum = new GraphQLEnumType({
    name: 'FilterDirection',
    description: `The direction that entities in a rankings result should be aligned.`,
    values: {
        DESCENDING: {
            value: 0,
        },
        ASCENDING: {
            value: 1
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
 *   views: Long!
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
            type: new GraphQLNonNull(longScalarType),
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
 *   total: Long!
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
            type: new GraphQLNonNull(longScalarType),
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
 * type ArtistThumbnails {
 *   original: String
 *   medium: String
 *   small: String
 *   tiny: String
 * }
 */
const artistThumbnailsType = new GraphQLObjectType({
    name: 'ArtistThumbnails',
    description: 'The thumbnails of an artist.',
    fields: {
        original: {
            type: GraphQLString,
            description: `The URL of an artist's original-size thumbnail.`,
            resolve: (thumbnails: ArtistThumbnails) => thumbnails[ArtistThumbnailType.ORIGINAL]
        },
        medium: {
            type: GraphQLString,
            description: `The URL of an artist's medium-size thumbnail.`,
            resolve: (thumbnails: ArtistThumbnails) => thumbnails[ArtistThumbnailType.MEDIUM]
        },
        small: {
            type: GraphQLString,
            description: `The URL of an artist's small-size thumbnail.`,
            resolve: (thumbnails: ArtistThumbnails) => thumbnails[ArtistThumbnailType.SMALL]
        },
        tiny: {
            type: GraphQLString,
            description: `The URL of an artist's tiny-size thumbnail.`,
            resolve: (thumbnails: ArtistThumbnails) => thumbnails[ArtistThumbnailType.TINY]
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
            type: artistThumbnailsType,
            description: 'The thumbnails of the artist.'
        },
        get baseArtist() {
            return {
                type: artistType,
                description: 'The artist an artist is based on.'
            }
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
 * type SongRankingsFilterResultItem {
 *   placement: Int!
 *   change: PlacementChange
 *   previousPlacement: Int
 *   views: Long!
 *   song: Song
 * }
 */
const songRankingsFilterResultItemType = new GraphQLObjectType({
    name: 'SongRankingsFilterResultItem',
    fields: {
        placement: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The placement of the filter result.'
        },
        change: {
            type: placementChangeEnum,
            description: `How a filter result's placement changed relative to its previous placement.`
        },
        previousPlacement: {
            type: GraphQLInt,
            description: 'The placement of the filter result in the previous period.'
        },
        views: {
            type: longScalarType,
            description: 'The amount of views that the filter result has.'
        },
        song: {
            type: songType,
            description: 'The song that is related to this filter result.'
        }
    }
})

/**
 * type SongRankingsFilterResult {
 *   totalCount: Int
 *   timestamp: String
 *   results: [SongRankingsFilterResultItem]
 * }
 */
const songRankingsFilterResultType = new GraphQLObjectType({
    name: 'SongRankingsFilterResult',
    description: 'Represents a song rankings filter result.',
    fields: {
        totalCount: {
            type: GraphQLInt,
            description: 'The total amount of possible results that can be returned by the query used to get this filter result. Not effected by maxEntires.'
        },
        timestamp: {
            type: GraphQLString,
            description: 'The timestamp of the filter result.'
        },
        results: {
            type: new GraphQLList(songRankingsFilterResultItemType),
            description: 'The results of this filter result.'
        }
    }
})

/**
 * type Query {
 *   song(id: Int!): Song
 * 
 *   artist(id: Int!): Artist
 * 
 *   songRankings(
 *     timestamp: String
 *     timePeriodOffset: number
 *     changeOffset: number
 *     daysOffset: number
 *     includeSourceTypes: [SourceType]
 *     excludeSourceTypes: [SourceType]
 *     includeSongTypes: [SongType]
 *     excludeSongTypes: [SongType]
 *     includeArtistTypes: [ArtistType]
 *     excludeArtistTypes: [ArtistType]
 *     publishDate: String
 *     orderBy: FilterOrder
 *     direction: FilterDirection
 *     artists: [Int]
 *     songs: [Int]
 *     singleVideo: Boolean
 *     maxEntries: Int
 *     startAt: 0
 *     minViews: Long
 *     maxViews: Long
 *     search: String
 *   ): SongRankingsFilterResult
 * }
 */
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        songRankings: {
            type: songRankingsFilterResultType,
            args: {
                timestamp: {
                    type: GraphQLString,
                    description: 'The timestamp to filter from. If not provided, defaults to the most recent timestamp.'
                },
                timePeriodOffset: {
                    type: GraphQLInt,
                    description: `Value is in days. If provided, song view counts will consist of the views they earned between [timestamp]-timePeriodOffset and [timestamp].`
                },
                changeOffset: {
                    type: GraphQLInt,
                    description: `Value is in days. If provided, enables the 'change' and 'previousPlacement' values of a result item. Controls the "previous" period.`
                },
                daysOffset: {
                    type: GraphQLInt,
                    description: `Value is in days. If provided, offsets [timestamp], [timePeriodOffset], and [changeOffset] by the provided amount of days.`
                },
                includeSourceTypes: {
                    type: new GraphQLList(sourceTypeEnum),
                    description: 'A list of SourceTypes to include.'
                },
                excludeSourceTypes: {
                    type: new GraphQLList(sourceTypeEnum),
                    description: 'A list of SourceTypes to exclude.'
                },
                includeSongTypes: {
                    type: new GraphQLList(songTypeEnum),
                    description: 'A list of SourceTypes to include.'
                },
                excludeSongTypes: {
                    type: new GraphQLList(songTypeEnum),
                    description: 'A list of SongTypes to exclude.'
                },
                includeArtistTypes: {
                    type: new GraphQLList(artistTypeEnum),
                    description: 'A list of ArtistTypes to include.'
                },
                excludeArtistTypes: {
                    type: new GraphQLList(artistTypeEnum),
                    description: 'A list of ArtistTypes to exclude.'
                },
                publishDate: {
                    type: GraphQLString,
                    description: 'Only include songs with the provided publish date.'
                },
                orderBy: {
                    type: filterOrderEnum,
                    description: 'What to order the results by.'
                },
                direction: {
                    type: filterDirectionEnum,
                    description: 'The direction to sort the results in.'
                },
                artists: {
                    type: new GraphQLList(GraphQLInt),
                    description: `A list of artist IDs. These artists' songs will only be included in the results`
                },
                songs: {
                    type: new GraphQLList(GraphQLInt),
                    description: `A list of song IDs that will only be included in the result.`
                },
                singleVideo: {
                    type: GraphQLBoolean,
                    description: `Controls whether single video mode is on or not. Single video calculates a song's total views using only the most viewed video per source`
                },
                maxEntries: {
                    type: GraphQLInt,
                    description: 'The maximum number of results to return. The maximum value is 50.'
                },
                startAt: {
                    type: GraphQLInt,
                    description: 'The placement to start getting results at.'
                },
                minViews: {
                    type: longScalarType,
                    description: 'The minimum amount of views that songs must have to be included in the results.'
                },
                maxViews: {
                    type: longScalarType,
                    description: 'The maximum amount of views that songs must have to be included in the results.'
                },
                search: {
                    type: GraphQLString,
                    description: 'Only includes songs who have names that match the search query.'
                }
            },
            resolve: (
                _source,
                {
                    timestamp,
                    timePeriodOffset,
                    changeOffest,
                    daysOffset,
                    includeSourceTypes,
                    excludeSourceType,
                    includeSongTypes,
                    excludeSongTypes,
                    includeArtistTypes,
                    excludeArtistTypes,
                    publishDate,
                    orderBy,
                    direction,
                    artists,
                    songs,
                    singleVideo,
                    maxEntries,
                    startAt,
                    minViews,
                    maxViews,
                    search
                }: {
                    timestamp?: string
                    timePeriodOffset?: number
                    changeOffest?: number
                    daysOffset?: number
                    includeSourceTypes?: number[]
                    excludeSourceType?: number[]
                    includeSongTypes?: number[]
                    excludeSongTypes?: number[]
                    includeArtistTypes?: number[]
                    excludeArtistTypes?: number[]
                    publishDate?: string
                    orderBy?: number
                    direction?: number
                    artists?: number[]
                    songs?: number[]
                    singleVideo?: boolean
                    maxEntries?: number
                    startAt?: number
                    minViews?: number
                    maxViews?: number
                    search?: string
                }
            ) => {
                // build params
                const filterParams = new SongRankingsFilterParams()
                filterParams.timestamp = timestamp
                filterParams.timePeriodOffset = timePeriodOffset
                filterParams.changeOffset = changeOffest
                filterParams.daysOffset = daysOffset
                filterParams.includeSourceTypes = includeSourceTypes
                filterParams.excludeSourceTypes = excludeSourceType
                filterParams.includeSongTypes = includeSongTypes
                filterParams.excludeSongTypes = excludeSongTypes
                filterParams.includeArtistTypes = includeArtistTypes
                filterParams.excludeArtistTypes = excludeArtistTypes
                filterParams.publishDate = publishDate
                filterParams.orderBy = orderBy || filterParams.orderBy
                filterParams.direction = direction || filterParams.direction
                filterParams.artists = artists
                filterParams.songs = songs
                filterParams.singleVideo = singleVideo || filterParams.singleVideo
                filterParams.maxEntries = Math.min(maxEntries || filterParams.maxEntries, 50)
                filterParams.startAt = Math.abs(startAt || filterParams.startAt)
                filterParams.minViews = minViews
                filterParams.maxViews = maxViews
                filterParams.search = search != undefined ? `%${search.trim()}%` : undefined
                return filterSongRankings(filterParams)
            }
        },
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
        songs: {
            type: new GraphQLList(songType),
            args: {
                ids: {
                    type: new GraphQLNonNull(new GraphQLList(GraphQLInt)),
                    description: 'The IDs of the songs.'
                }
            },
            resolve: (
                _source,
                { ids }: { ids: number[] }
            ) => ids.map(id => getSong(id))
        },
        artist: {
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
        },
        artists: {
            type: new GraphQLList(artistType),
            args: {
                ids: {
                    type: new GraphQLNonNull(new GraphQLList(GraphQLInt)),
                    description: 'The IDs of the artists.'
                }
            },
            resolve: (
                _source,
                { ids }: { ids: number[] }
            ) => ids.map(id => getArtist(id))
        },
        searchArtist: {
            type: new GraphQLList(artistType),
            args: {
                query: {
                    type: new GraphQLNonNull(GraphQLString),
                    description: 'The name of the artist to search for.'
                },
                maxEntries: {
                    type: GraphQLInt,
                    description: 'The maximum number of results to return. The maximum value is 50.'
                },
                startAt: {
                    type: GraphQLInt,
                    description: 'The placement to start getting results at.'
                }
            },
            resolve: async (
                _source,
                {
                    query,
                    maxEntries,
                    startAt
                }: {
                    query: string
                    maxEntries: number | undefined
                    startAt: number | undefined
                }
            ) => searchArtists(
                query.trim(),
                Math.min(maxEntries || 50, 50),
                Math.abs(startAt || 0)
            )
        }
    }
})

export const Schema: GraphQLSchema = new GraphQLSchema({
    query: queryType,
    types: [songType, artistType, songRankingsFilterResultType]
})