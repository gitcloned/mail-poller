const moment = require('moment')
const fileExtension = require('file-extension')
const format = require("stringformat")

class MailBackend {

    constructor(clientname, config) {

        this.clientname = clientname
        this.mail_backend = null
        this.attachment_backend = null

        this.attachmentConfig = config.attachments || {}

        if (this.attachmentConfig.skipBody === "true") this.attachmentConfig.skipBody = true
        else this.attachmentConfig.skipBody = false

        if (this.attachmentConfig.allowAttachments) this.attachmentConfig.allowAttachments = this.attachmentConfig.allowAttachments.split(",")
        else this.attachmentConfig.allowAttachments = null


        console.log(' mail backend: [%s]', config.backend.mail)
        console.log(' attachment backend: [%s]', config.backend.attachments)

        switch (config.backend.mail) {

            case "sqlite":
                var SQLite = require('./backends/mail/SQLite')
                this.mail_backend = new SQLite(clientname, config.sqlite)
                break
            case 'mongodb':
                var MongoDB = require('./backends/mail/MongoDB')
                this.mail_backend = new MongoDB(clientname, config.mongodb)
                break
            default:
                var NoBackend = require('./backends/mail/NoBackend')
                this.mail_backend = new NoBackend(clientname, {})
                break
        }

        switch (config.backend.attachments) {

            case "s3":
                var S3 = require('./backends/attachments/S3')
                this.attachment_backend = new S3(clientname, config.s3, config.attachments)
                break
            case "sftp":
                console.log(' creating SFTP backend')
                var SFTP = require('./backends/attachments/SFTP')
                this.attachment_backend = new SFTP(clientname, config.sftp, config.attachments)
                break
            default:
                var NoBackend = require('./backends/attachments/NoBackend')
                this.attachment_backend = new NoBackend(clientname, {}, config.attachments)
                break
        }
    }

    init(callback) {

        this.mail_backend.init(callback)
    }

    saveInfo(mail, callback) {

        var messageId = mail.messageId

        var clientname = this.clientname
        var backend = this.mail_backend

        var date = mail.date

        var info = {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDay(),
            mmddyyyy: moment(date).format("MM-DD-YYYY"),
            mmddyyyyhhss: moment(date).format("MM-DD-YYYY-hh-mm-ss"),
            messageId: messageId,
            clientname: clientname,
            runInfo: mail.runInfo
        }

        if (this.attachmentConfig.skipBody)
            mail.body.storage = null
        else
            mail.body.storage = this.attachment_backend.info(info, mail.body)

        for (var i = 0; i < mail.attachments.length; i++) {

            var filename = mail.attachments[i].filename
            var extn = fileExtension(filename)

            if (this.attachmentConfig.allowAttachments && this.attachmentConfig.allowAttachments.indexOf(extn) === -1) {
                mail.attachments[i].storage = null
                continue
            }

            info.file = {}

            info.file.name = filename.replace(new RegExp("." + extn, "i"), '')
            info.file.extn = extn

            mail.attachments[i].storage = this.attachment_backend.info(info, mail.attachments[i])
        }

        info = null

        backend.saveMail(messageId, mail, (err, exists) => {

            if (err) {
                return callback(err)
            }

            callback(null, exists)
        })
    }

    saveBodyAndAttachments(mail, callback) {

        var messageId = mail.messageId

        var backend = this.attachment_backend

        backend.saveBodyAndAttachments(messageId, mail, callback)
    }

    run(pollerName, pollerConfig) {

        return this.mail_backend.run(pollerName, pollerConfig)
    }

    findMail(id, callback) {

        this.mail_backend.findMail(id, callback)
    }
}

module.exports = MailBackend
