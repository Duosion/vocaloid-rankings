const ArtistType = require("../enums/ArtistType")
const FilterDirection = require("../enums/FilterDirection")
const FilterOrder = require("../enums/FilterOrder")
const SongType = require("../enums/SongType")
const ViewType = require("../enums/ViewType")

module.exports = class RankingsFilterParams {
    /**
     * Creates a new instance of a RankingsFilterParams object.
     * This object describes how a SongsDataProxy.filterRankings request should be filtered.
     * 
     * @param {string} [timestamp] The timestamp to target. Example: 2023-02-05.
     * @param {number} [timePeriodOffset] In days. If provided, gets the number of views at the timestamp (timestamp - timePeriodOffset) and subtracts it from the views at (timestamp).
     * @param {number} [changeOffset] In days. If provided, gets the change in placement between (timestamp) and (timestamp - changeOffset).
     * @param {ViewType} [viewType] If provided, only gets the rankings for songs with the provided view type.
     * @param {SongType} [songType] If provided, only gets the rankings for songs with the provided song type.
     * @param {ArtistType} [artistType] If provided, only gets the rankings for songs where one of the artists is of the provided artist type.
     * @param {string} [publishDate] Similar to timestamp, however, if provided, gets the rankings for songs that were published in the provided publish date. Example: 2022, 2023-02, 2022-05-12 
     * @param {FilterOrder} [orderBy] What to order the ranking results by. By default, orders by views
     * @param {FilterDirection} [direction] What direction to order the ranking results in. By default is descending. 
     * @param {number[]} [artists] An array of artist IDs. If provided, only returns rankings results with songs that contain the provided artist ids.
     * @param {number} [maxEntries] The maximum number of rankings entries to return. Default: 50.
     * @param {number} [startAt] The amount to offset the resulting rankings entries. Default: 0.
     */
    constructor(
        timestamp,
        timePeriodOffset,
        changeOffset = 0,
        viewType,
        songType,
        artistType,
        publishDate,
        orderBy = FilterOrder.Views,
        direction = FilterDirection.Descending,
        artists,
        maxEntries = 50,
        startAt = 0,
    ) {
        this.timestamp = timestamp
        this.timePeriodOffset = timePeriodOffset
        this.changeOffset = changeOffset
        this.viewType = viewType
        this.songType = songType
        this.artistType = artistType
        this.publishDate = publishDate
        this.orderBy = orderBy
        this.direction = direction
        this.artists = artists
        this.maxEntries = maxEntries
        this.startAt = startAt
    }
}