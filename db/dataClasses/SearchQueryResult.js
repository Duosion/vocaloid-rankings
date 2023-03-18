const SearchQueryResultItem = require("./SearchQueryResultItem")

module.exports = class SearchQueryResult {

    /**
     * Creates a SearchQueryResult object that represents what is returned by a search query.
     * 
     * @param {number} totalCount The total amount of items.
     * @param {SearchQueryResultItem[]} results The results returned by this query.
     */
    constructor(
        totalCount,
        results
    ) {
        this.totalCount = totalCount
        this.results = results
    }

}