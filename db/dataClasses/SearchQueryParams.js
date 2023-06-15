module.exports = class SearchQueryParams {

    /**
     * Builds a SearchQueryParams object for search querying.
     * 
     * @param {string} query The query to search for.
     * @param {number} [maxEntries] The maximum number of entries to return. Default: 25.
     * @param {number} [startAt] The position to start at. Default: 0.
     * @param {number} [minimumDistance] The minimum Levenshtein distance that results will be returned at.
     * @param {number} [maximumDistance] The maximum Levenshtein distance that results will be returned at.
     */
    constructor(
        query,
        maxEntries = 25,
        startAt = 0,
        minimumDistance = 0,
        maximumDistance = 500
    ) {
        this.query = query
        this.maxEntries = maxEntries
        this.startAt = startAt
        this.minimumDistance = minimumDistance
        this.maximumDistance = maximumDistance
    }

}