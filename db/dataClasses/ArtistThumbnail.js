const ArtistThumbnailType = require("../enums/ArtistThumbnailType")

module.exports = class ArtistThumbnail {

    /**
     * 
     * @param {ArtistThumbnailType} type 
     * @param {string} url 
     * @param {string} averageColor 
     */
    constructor(
        type,
        url,
        averageColor
    ) {
        this.type = type
        this.url = url
        this.averageColor = averageColor
    }

}