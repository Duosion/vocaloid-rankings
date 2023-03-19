const ArtistCategory = require("../enums/ArtistCategory")
const ArtistType = require("../enums/ArtistType")
const ArtistThumbnail = require("./ArtistThumbnail")

module.exports = class Artist {

    /**
     * 
     * @param {number} id This artist's id.
     * @param {ArtistType} type This artist's type.
     * @param {ArtistCategory} [category] This artist's category.
     * @param {string} publishDate When this artist was released.
     * @param {string} additionDate When this artist was added to the database.
     * @param {string[]} names This artist's name.
     * @param {ArtistThumbnail[]} thumbnails The thumbnails for this artist.
     * @param {number} [baseArtistId] The id of this artist's base artist.
     * @param {string} [averageColor] The average color of this artist's thumbnail.
     * @param {string} [darkColor] The dark color for this artist.
     * @param {string} [lightColor] The light color for this artist.
     */
    constructor(
        id,
        type,
        category,
        publishDate,
        additionDate,
        names,
        thumbnails,
        baseArtistId,
        averageColor,
        darkColor,
        lightColor
    ) {
        this.id = id
        this.type = type
        this.category = category
        this.publishDate = publishDate
        this.additionDate = additionDate
        this.names = names
        this.thumbnails = thumbnails
        this.baseArtist = baseArtistId
        this.averageColor = averageColor
        this.darkColor = darkColor
        this.lightColor = lightColor
    }

}