
class Mail {

    constructor(clientname, id) {

        this.clientname = clientname

        this.messageId = id
        this.headers = {}
        this.body = null
        this.subject = null
        this.date = null
        this.attachments = []
        this.from = null
        this.to = null
        this.runInfo = null
    }

    setHeader(headers) {
        this.headers = headers
        return this
    }

    setBody(body) {
        this.body = body
        return this
    }

    setSubject(subject) {
        this.subject = subject
        return this
    }

    setDate(date) {
        this.date = date
        return this
    }

    setAttachments(attachments) {
        this.attachments = attachments || []
        return this
    }

    fetch (mailBackend, callback) {

        const mailId = this.messageId

        var self = this
        mailBackend.findMail(mailId, (err, mailDoc) => {

            if (err) return callback(err)

            if (!mailDoc) return callback("Cannot find mail by id: " + mailId)

            self.headers = mailDoc.headers
            self.body = mailDoc.body
            self.date = mailDoc.date
            self.from = mailDoc.from
            self.to = mailDoc.to
            self.subject = mailDoc.subject
            self.runInfo = mailDoc.runInfo
            self.attachments = mailDoc.attachments

            callback(null, true)
        })
    }
}

module.exports = Mail