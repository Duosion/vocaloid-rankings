module.exports = class EntityViews {

    /**
     * Creates an instance of the EntityViews object.
     * 
     * @param {string=} timestamp // the timestamp that these views were captured at.
     * @param {number} total // the total views for this song.
     * @param {Object.<string, number>[]} breakdown // the breakdown of the views for this song by platform and video.
     */
    constructor(
        timestamp,
        total,
        breakdown
    ) {
        this.timestamp = timestamp
        this.total = total
        this.breakdown = breakdown
    }

}