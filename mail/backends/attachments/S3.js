const format = require("string-template")
var s3 = require('s3')

class S3 {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.bucket = format(this.config.db, {
            clientname: clientname.replace(/\s+/g, '')
        })
    }

    init(callback) {

        
    }

    saveMail(id, mail, callback) {

        callback("S3 does not support saving mail info")
    }

    saveAttachments(id, attachments, callback) {

        
    }
}

module.exports = S3