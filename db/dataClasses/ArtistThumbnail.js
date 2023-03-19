const ArtistThumbnailType = require("../enums/ArtistThumbnailType")

module.exports = class ArtistThumbnail {

    /**
     * 
     * @param {ArtistThumbnailType} type 
     * @param {string} url
     */
    constructor(
        type,
        url,
    ) {
        this.type = type
        this.url = url
    }

}