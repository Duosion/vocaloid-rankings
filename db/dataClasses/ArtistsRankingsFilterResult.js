const ArtistsRankingsFilterResultItem = require("./ArtistsRankingsFilterResultItem")

module.exports = class ArtistsRankingsFilterResult {

    /**
     * Represents a rankings filter result.
     * 
     * @param {number} totalCount The total count of every possible result. Not specifically the length of results.
     * @param {string} timestamp The timestamp of this result.
     * @param {ArtistsRankingsFilterResultItem[]} results The actual results.
     */
    constructor(
        totalCount,
        timestamp,
        results 
    ) {
        this.totalCount = totalCount
        this.timestamp = timestamp
        this.results = results
    }

}