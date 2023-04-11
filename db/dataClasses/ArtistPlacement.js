module.exports = class ArtistPlacement {
    /**
     * Creates a new ArtistPlacement object, which shows a artists's ranking in various categories.
     * 
     * @param {number} allTime This song's all time placement.
     */
    constructor(
        allTime,
    ) {
        this.allTime = allTime
    }
}