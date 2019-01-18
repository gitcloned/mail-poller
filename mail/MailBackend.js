
class MailBackend {

    constructor(clientname, config) {

        this.mail_backend = null
        this.attachment_backend = null

        console.log(' mail backend: [%s]', config.backend.mail)

        switch (config.backend.mail) {

            case "sqlite":
                var SQLite = require('./backends/SQLite')
                this.mail_backend = new SQLite(clientname, config.sqlite)
                break
            case 'mongodb':
                var MongoDB = require('./backends/MongoDB')
                this.mail_backend = new MongoDB(clientname, config.mongodb)
                break
        }
    }

    init (callback) {

        this.mail_backend.init(callback)
    }

    save(mail, callback) {

        var id = mail.id

        this.mail_backend.saveMail(id, mail, (err, exists) => {

            if (err) {
                return callback(err)
            }

            callback(null, exists)
        })
    }
}

module.exports = MailBackend