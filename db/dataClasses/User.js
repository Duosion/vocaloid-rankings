const AccessLevel = require("../enums/AccessLevel")

module.exports = class User {

    /**
     * Creates a new user.
     * 
     * @param {string} username The user's username.
     * @param {string} hash The user's password hash.
     * @param {Date} created When the account was created. 
     * @param {Date} lastLogin When the user was last logged in. 
     * @param {AccessLevel} accessLevel 
     */
    constructor(
        username,
        hash,
        created,
        lastLogin,
        accessLevel
    ) {
        this.username = username
        this.hash = hash
        this.created = created
        this.lastLogin = lastLogin
        this.accessLevel = accessLevel
    }

}