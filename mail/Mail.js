
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
}

module.exports = Mail