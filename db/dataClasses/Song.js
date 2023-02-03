const NameType = require("../enums/NameType");
const SongType = require("../enums/SongType");
const Artist = require("./Artist");
const SongViews = require("./SongViews");

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
     * @param {string} [fandomUrl] // the fandom URL for this song
     * @param {Artist[]} artists // this song's artists
     * @param {string[]} names // this song's names
     * @param {Array.<string>[]} videoIds
     * @param {SongViews=} views // this song's views
     */
    constructor(
        id,
        publishDate,
        additionDate,
        type,
        thumbnail,
        maxresThumbnail,
        averageColor,
        fandomUrl,
        artists,
        names,
        videoIds,
        views
    ) {
        this.id = id
        this.publishDate = publishDate
        this.additionDate = additionDate
        this.type = type
        this.thumbnail = thumbnail
        this.maxresThumbnail = maxresThumbnail
        this.averageColor = averageColor
        this.fandomUrl = fandomUrl
        this.artists = artists
        this.names = names
        this.videoIds = videoIds
        this.views = views
    }

}