const format = require("string-template")
const async = require('async')

var AWS = require('aws-sdk')

class S3 {

    constructor(clientname, config) {

        this.clientname = clientname
        this.config = config

        this.bucket = format(this.config.bucket, {
            clientname: clientname.replace(/\s+/g, '')
        })
        this.folder = this.config.folder

        this.s3 = new AWS.S3({
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey
        })

        this.filename = this.config.filename
    }

    init(callback) {


    }

    saveMail(id, mail, callback) {

        callback("S3 does not support saving mail info")
    }

    saveBodyAndAttachments(id, mail, callback) {

        // console.log("saving mail body and attachments")

        var attachments = mail.attachments

        var body = mail.body

        var tasks = []

        let s3 = this.s3

        var task = (object, next) => {

            return next(null, function (callback) {

                if (object.storage === null) callback(null)

                s3.upload({
                    Bucket: object.storage.bucket,
                    Key: [object.storage.folder, object.storage.filename].join("/"),
                    Body: object.data
                }, callback)
            })
        }

        var objectsToSave = attachments.concat([body])

        /**
         * save mail objects
         */
        async.map(objectsToSave, task, (err, tasks) => {

            async.parallelLimit(tasks, 10, (err) => {

                if (err) {
                    return callback(err)
                }

                callback(null)
            })
        })
    }

    info(info, object) {

        return {
            "type": "s3",
            "bucket": this.bucket,
            "folder": format(this.folder, info),
            "filename": this.filename ? format(this.filename, info) : this.filename
        }
    }
}

module.exports = S3