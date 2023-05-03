const User = require("./User")

module.exports = class Session {

    /**
     * Creates a new login session.
     * 
     * @param {string} id 
     * @param {User} user 
     * @param {Date} created 
     * @param {Date} expires 
     * @param {boolean} stayLoggedIn
     */
    constructor(
        id,
        user,
        created,
        expires,
        stayLoggedIn
    ) {
        this.id = id
        this.user = user
        this.created = created
        this.expires = expires
        this.stayLoggedIn = stayLoggedIn
    }

}