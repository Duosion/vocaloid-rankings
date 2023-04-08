module.exports = class CachedThumbnail {

    /**
     * Creates an instance of a cached song thumbnail.
     * 
     * @param {any} data // this thumbnail's data
     * @param {ViewType} type // the type of this thumbnail
     */
    constructor(
        data,
        type
    ) {
        this.data = data
        this.type = type
    }

}