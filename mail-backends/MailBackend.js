class MailBackend {

    constructor(clientname, config) {

        this.clientname = clientname
        this.mail_backend = null
        this.attachment_backend = null

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
                this.attachment_backend = new S3(clientname, config.s3)
                break
            case "sftp":
                console.log(' creating SFTP backend')
                var SFTP = require('./backends/attachments/SFTP')
                this.attachment_backend = new SFTP(clientname, config.sftp)
                break
            default:
                var NoBackend = require('./backends/attachments/NoBackend')
                this.attachment_backend = new NoBackend(clientname, {})
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
            messageId: messageId,
            clientname: clientname,
            runInfo: mail.runInfo
        }

        mail.body.storage = this.attachment_backend.info(info, mail.body)

        for (var i = 0; i < mail.attachments.length; i++)
            mail.attachments[i].storage = this.attachment_backend.info(info, mail.attachments[i])

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
