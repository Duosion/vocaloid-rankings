const PlacementChange = require("../enums/PlacementChange");
const Artist = require("./Artist");

module.exports = class ArtistsRankingsFilterResultItem {
    /**
     * Represents a song's ranking placement.
     * 
     * @param {number} placement // the ranking, 0, 1, 2, 3, etc...
     * @param {PlacementChange} [change] // the change from the previous time period.
     * @param {number} [previousPlacement] // the previous placement
     * @param {number} views The amount of views that this rankings entry has.
     * @param {Artist} artist // the song that this ranking belongs to
     */
    constructor(
        placement,
        change = PlacementChange.SAME,
        previousPlacement,
        views,
        artist
    ) {
        this.placement = placement
        this.change = change
        this.previousPlacement = previousPlacement
        this.views = views
        this.artist = artist
    }

}