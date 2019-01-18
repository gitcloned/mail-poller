
class MailBackend {

    constructor(clientname, config) {

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
        }

        switch (config.backend.attachments) {

            case "s3":
                var S3 = require('./backends/attachments/S3')
                this.attachment_backend = new S3(clientname, config.s3)
                break
        }
    }

    init (callback) {

        this.mail_backend.init(callback)
    }

    save(mail, callback) {

        var id = mail.id

        var attachment_backend = this.attachment_backend
        var mail_backend = this.mail_backend

        this.mail_backend.saveMail(id, mail, (err, exists) => {

            if (err) {
                return callback(err)
            }

            if (exists)
                return callback(null, exists)

            attachment_backend.saveMail(id, mail, (err, info) => {
                
            })
        })
    }
}

module.exports = MailBackend