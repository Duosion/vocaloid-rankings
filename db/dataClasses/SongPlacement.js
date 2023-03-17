module.exports = class SongPlacement {
    /**
     * Creates a new SongPlacement object, which shows a song's ranking in various categories.
     * 
     * @param {*} allTime This song's all time placement.
     * @param {*} releaseYear This song's ranking in its release year.
     */
    constructor(
        allTime,
        releaseYear,
    ) {
        this.allTime = allTime
        this.releaseYear = releaseYear
    }
}