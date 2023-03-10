module.exports = class HistoricalViews {

    /**
     * Creates an instance of the HistoricalViews object.
     * 
     * @param {number} views // the total views for this video.
     * @param {string} timestamp // the timestamp of these views.
     */
    constructor(
        views,
        timestamp
    ) {
        this.views = views
        this.timestamp = timestamp
    }

}