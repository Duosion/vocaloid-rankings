module.exports = class VideoViews {

    /**
     * Creates an instance of the VideoViews object.
     * 
     * @param {string} id // the ID of the video that this object belongs to.
     * @param {number} views // the total views for this video.
     */
    constructor(
        id,
        views
    ) {
        this.id = id
        this.views = views
    }

}