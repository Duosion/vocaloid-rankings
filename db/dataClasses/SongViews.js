module.exports = class SongViews {

    /**
     * Creates an instance of the SongsViews object.
     * 
     * @param {number} songId // the song that these views belong to.
     * @param {string=} timestamp // the timestamp that these views were captured at.
     * @param {number} total // the total views for this song.
     * @param {Object.<string, number>[]} breakdown // the breakdown of the views for this song by platform and video.
     */
    constructor(
        songId,
        timestamp,
        total,
        breakdown
    ) {
        this.songId = songId
        this.timestamp = timestamp
        this.total = total
        this.breakdown = breakdown
    }

}