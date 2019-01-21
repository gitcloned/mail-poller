
const dbinit = require('node-db-init-sqlite3')

class SQLite {

    constructor(config) {

        this.config = config
    }

    init(callback) {

        if (this.config.init) {

            dbinit.initialize(
                this.config.dbpath,          // File to save sqlite3 database to
                this.config.init,  // Configuration directory
                callback)
        }
    }

    saveMail (id, mail, callback) {

        
    }

    saveAttachments (id, attachments, callback) {

        callback("SQLite does not support saving attachment")
    }
}

module.exports = SQLite