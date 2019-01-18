const imaps = require('imap-simple')
const uuidv1 = require('uuid/v1')
const addrs = require("email-addresses")

const parseEmailAddress = (addresses) => {

    if (!(addresses instanceof Array))
        addresses = [addresses]

    for (var i = 0; i < addresses.length; i++) {
        var parsed = addrs.parseOneAddress(addresses[i].toString())

        addresses[i] = {
            "name": parsed.name,
            "address": parsed.address,
            "local": parsed.local,
            "domain": parsed.domain,
            "groupName": parsed.groupName
        }
    }

    return addresses
}

class Mail {

    constructor(header, body) {

        this.header = header
        this._body = body
        this.attachments = null

        this.id = header['message-id'] || uuidv1()
    }

    setAttachments(attachments) {

        this.attachments = attachments
    }

    subject() {
        return this.header.subject
    }

    to() {
        return parseEmailAddress(this.header.to)
    }

    date() {
        return this.header.date
    }

    from() {
        return parseEmailAddress(this.header.from)
    }

    attachments() {
        return this.attachments
    }

    body() {
        return this._body
    }

    messageId() {
        return this.id
    }

    contentType() {
        return this.header['content-type']
    }

    replyTo() {
        return parseEmailAddress(this.header['reply-to'])
    }

    headers() {
        return this.header
    }
}

class MailObject {

    constructor(clientname, message) {

        this.clientname = clientname
        this.message = message
        this.mailId = null

        this.parsed = false
        this.saved = false

        this.mail = null
    }

    parse(connection, callback) {

        if (this.parsed) return callback()

        let headerIndex = 0
        var headerItem = null
        var bodyItem = null

        this.message.parts.forEach(function (item, index) {

            if (item && item["which"].indexOf("HEADER") > -1) {

                headerIndex = index
                headerItem = item
            } else if (item && item["which"].indexOf("TEXT") > -1) {

                bodyItem = item
            }
        })

        /**
         * parse attachments
         */
        var parts = imaps.getParts(this.message.attributes.struct)
        var message = this.message

        var attachments = parts.filter(function (part) {
            return (part.type.indexOf('text') > -1 && part.subtype.indexOf('html') > -1 && !part.disposition) || (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')
        }).map(function (part) {

            return connection.getPartData(message, part)
                .then(function (partData) {

                    var isAttachment = false

                    if (part.disposition && part.disposition.type && part.disposition.type.toUpperCase() === "ATTACHMENT")
                        isAttachment = true

                    return {
                        filename: (part.disposition && part.disposition.params.filename) ? part.disposition.params.filename : (isAttachment ? 'bodyAttach' : 'mail-body') + '.html',
                        data: partData,
                        header: message["parts"][headerIndex]["body"],
                        uid: message["attributes"]["uid"],
                        arrivalDate: message["attributes"].date
                    };
                });
        })

        this.mail = new Mail(headerItem.body, bodyItem.body)

        var that = this
        var promise = Promise.all(attachments)

        promise.then((attachments) => {

            that.mail.setAttachments(attachments)
            callback(null)
        }).catch(callback)
    }

    save(mailBackend, connection, callback) {

        if (this.saved) return callback()

        var that = this

        this.parse(connection, (err) => {

            if (err) {
                // TODO: log here
                return callback(err)
            }

            mailBackend.save(that.mail, (err, exists) => {

                if (err) {
                    // TODO: log here
                    return callback(err)
                }

                that.saved = true

                callback(null, exists ? null : that.mail.id)
            })
        })
    }

}

module.exports = MailObject