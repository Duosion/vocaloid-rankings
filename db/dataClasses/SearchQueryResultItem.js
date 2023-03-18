const SearchQueryResultItemType = require("../enums/SearchQueryResultItemType")
const Artist = require("./Artist");
const Song = require("./Song")

module.exports = class SearchQueryResultItem {

    /**
     * Creates a new SearchQueryResultItem that represents an item returned by a search Query.
     * 
     * @param {number} placement The placement of this result item.
     * @param {SearchQueryResultItemType} type The type of this result item. Specifys whether this item is a song or an artist.
     * @param {Song | Artist} data The data for this item. Is either a Song or an Artist depending on type.
     * @param {number} distance The Levenshtein distance for this search query result item.
     */
    constructor(
        placement,
        type,
        data,
        distance
    ) {
        this.placement = placement
        this.type = type
        this.data = data
        this.distance = distance
    }

}