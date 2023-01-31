const ArtistCategory = require("../enums/ArtistCategory")
const ArtistType = require("../enums/ArtistType")
const ArtistThumbnail = require("./ArtistThumbnail")

module.exports = class Artist {

    /**
     * 
     * @param {number} id 
     * @param {ArtistType} type 
     * @param {ArtistCategory} [category]
     * @param {string} publishDate 
     * @param {string} additionDate 
     * @param {string[]} names 
     * @param {ArtistThumbnail[]} thumbnails 
     */
    constructor(
        id,
        type,
        category,
        publishDate,
        additionDate,
        names,
        thumbnails,
    ) {
        this.id = id
        this.type = type
        this.category = category
        this.publishDate = publishDate
        this.additionDate = additionDate
        this.names = names
        this.thumbnails = thumbnails
    }

}