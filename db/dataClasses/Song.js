const SongType = require("../enums/SongType");
const Artist = require("./Artist");
const SongPlacement = require("./SongPlacement");
const EntityViews = require("./EntityViews");

module.exports = class Song {

    /**
     * Creates a new Song data class.
     * 
     * @param {number} id // The id of this song.
     * @param {string} publishDate // When this song was published.
     * @param {string} additionDate // When this song was added to the database. 
     * @param {SongType} type // this song's type.
     * @param {string} thumbnail // the URL for this song's thumbnail
     * @param {string} maxresThumbnail // the URL for this song's maximum resolution thumbnail
     * @param {string} averageColor // the average color of this song's thumbnail
     * @param {string} darkColor // the averageColor adjusted for a dark theme.
     * @param {string} lightColor // the averageColor adjusted for a light theme.
     * @param {string} [fandomUrl] // the fandom URL for this song
     * @param {Artist[]} artists // this song's artists
     * @param {string[]} names // this song's names
     * @param {Array.<string>[]} videoIds // this song's video ids
     * @param {EntityViews=} views // this song's views
     * @param {SongPlacement} [placement] // this song's placements
     * @param {ViewType} [thumbnailType] // this song's thumbnail type
     * @param {string} [displayThumbnail] // the thumbnail to display
     * @param {string} [maxresDisplayThumbnail] // the maximum res display thumbnail to display
     * @param {boolean} [dormant]
     * @param {string} [lastUpdated]
     */
    constructor(
        id,
        publishDate,
        additionDate,
        type,
        thumbnail,
        maxresThumbnail,
        averageColor,
        darkColor,
        lightColor,
        fandomUrl,
        artists,
        names,
        videoIds,
        views,
        placement,
        thumbnailType,
        displayThumbnail,
        maxresDisplayThumbnail,
        dormant,
        lastUpdated
    ) {
        this.id = id
        this.publishDate = publishDate
        this.additionDate = additionDate
        this.type = type
        this.thumbnail = thumbnail
        this.maxresThumbnail = maxresThumbnail
        this.averageColor = averageColor
        this.darkColor = darkColor
        this.lightColor = lightColor
        this.fandomUrl = fandomUrl
        this.artists = artists
        this.names = names
        this.videoIds = videoIds
        this.views = views
        this.placement = placement
        this.thumbnailType = thumbnailType
        this.displayThumbnail = displayThumbnail
        this.maxresDisplayThumbnail = maxresDisplayThumbnail
        this.dormant = dormant
        this.lastUpdated = lastUpdated
    }

}