const RankingsFilterResultItem = require("./RankingsFilterResultItem")

module.exports = class RankingsFilterResult {

    /**
     * Represents a rankings filter result.
     * 
     * @param {number} totalCount The total count of every possible result. Not specifically the length of results.
     * @param {string} timestamp The timestamp of this result.
     * @param {RankingsFilterResultItem[]} results The actual results.
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