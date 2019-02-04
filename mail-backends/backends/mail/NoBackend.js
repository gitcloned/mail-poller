const format = require("string-template")

var Run = require('../../../mail-pollers/Run')

class NoBackend {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config
    }

    init(callback) {

        callback(null)
    }

    saveMail(id, mail, callback) {

        callback(null, false)
    }

    saveBodyAndAttachments(id, mail, callback) {

        callback("NoBackend does not support saving attachment")
    }

    info (messageId, date, object) {

        return {
            "type": "not-saved"
        }
    }

    run(pollerName, pollerConfig) {

        return new Run(pollerName, pollerConfig, this.clientname, this.run_model)
    }
}

module.exports = NoBackend