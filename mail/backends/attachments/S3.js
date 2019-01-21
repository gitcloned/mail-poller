const format = require("string-template")

class S3 {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.bucket = format(this.config.bucket, {
            clientname: clientname.replace(/\s+/g, '')
        })
        this.folder = this.config.folder
    }

    init(callback) {


    }

    saveMail(id, mail, callback) {

        callback("S3 does not support saving mail info")
    }

    saveBodyAndAttachments(id, mail, callback) {

        var attachments = mail.attachments()

        callback(null)
    }

    info(info, object) {

        return {
            "type": "s3",
            "bucket": this.bucket,
            "folder": format(this.folder, info)
        }
    }
}

module.exports = S3