const format = require("string-template")
const async = require('async')

class NoBackend {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config
    }

    init(callback) {

        callback(null)
    }

    saveMail(id, mail, callback) {

        callback(null)
    }

    saveBodyAndAttachments(id, mail, callback) {

        callback(null)
    }

    info(info, object) {

        return {
            "type": "not-saved"
        }
    }
}

module.exports = S3