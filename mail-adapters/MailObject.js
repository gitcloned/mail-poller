const imaps = require('imap-simple')
const uuidv1 = require('uuid/v1')
const addrs = require("email-addresses")

var Mail = require('../Mail')

const header_keys = ['content-type', 'mime-version', 'return-path', 'received', 'content-transfer-encoding', 'in-reply-to', 'references']
const attachment_header_keys = ['content-type', 'mime-version', 'content-transfer-encoding']
const address_keys = ['from', 'to']
const date_keys = ['date']

const parseEmailAddress = (addresses) => {

    if (!(addresses instanceof Array))
        addresses = [addresses]

    var list = []

    for (var i = 0; i < addresses.length; i++) {
	if (addresses[i].split(",").length > 1) list = list.concat(addresses[i].split(","))
	else list.push(addresses[i])
    }

    addresses = list

    for (var i = 0; i < addresses.length; i++) {

        var parsed = addrs.parseOneAddress(addresses[i].toString())

        if (!parsed) continue

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

const parseError = (err) => {
    return {
        msg: err.toString(),
        stack: err.stack
    }
}

class MailObject {

    constructor(clientname, message) {

        this.clientname = clientname
        this.message = message

        this.parsed = false
        this.saved = false
    }

    parseHeader(headers, mail) {

        var mailHeader = {}

        for (var i = 0; i < header_keys.length; i++) {
            mailHeader[header_keys[i]] = headers[header_keys[i]]
        }

        for (var i = 0; i < address_keys.length; i++) {
            mail[address_keys[i]] = parseEmailAddress(headers[address_keys[i]])
        }

        for (var i = 0; i < date_keys.length; i++) {
            mail[date_keys[i]] = new Date(headers[date_keys[i]])
        }

        mail['subject'] = headers['subject']

        return mailHeader
    }

    parseAttachmentHeader(headers) {

        var mailHeader = {}

        for (var i = 0; i < attachment_header_keys.length; i++) {
            mailHeader[attachment_header_keys[i]] = headers[attachment_header_keys[i]]
        }

        return mailHeader
    }

    parseBody() {

        return {
            filename: 'mail-body.html',
            // specify where the attachment is stored
            storage: null,
            // contains raw data
            data: null // body
        }
    }

    parse(connection, callback) {

        if (this.parsed) return callback()

        var mail = null

        try {

            let headerIndex = 0
            var headerItem = null
            var bodyItem = null

            var message = this.message

            message.parts.forEach(function (item, index) {

                if (item && item["which"].indexOf("HEADER") > -1) {

                    headerIndex = index
                    headerItem = item
                } else if (item && item["which"].indexOf("TEXT") > -1) {

                    bodyItem = item
                }
            })

            mail = new Mail(this.clientname, headerItem.body['message-id'] || uuidv1())

            // console.log(Object.keys(headerItem.body))

            mail.setHeader(this.parseHeader(headerItem.body, mail))
                .setBody(this.parseBody(bodyItem.body))

            /**
             * parse attachments
             */
            var parts = imaps.getParts(this.message.attributes.struct)

            var that = this

            var attachments = parts.filter(function (part) {
                return (part.type.indexOf('text') > -1 && part.subtype.indexOf('html') > -1 && !part.disposition) || (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')
            }).map(function (part) {

                var isAttachment = false

                if (part.disposition && part.disposition.type && part.disposition.type.toUpperCase() === "ATTACHMENT")
                    isAttachment = true

                return {
                    filename: (part.disposition && part.disposition.params.filename) ? part.disposition.params.filename : (isAttachment ? 'bodyAttach' : 'mail-body') + '.html',
                    header: that.parseAttachmentHeader(message["parts"][headerIndex]["body"]),
                    attachmentId: message["attributes"]["uid"],
                    date: message["attributes"].date,
                    // specify where the attachment is stored
                    storage: null,
                    // contains raw data
                    data: null
                }
            })

            mail.setAttachments(attachments)
        }catch(err) {
            return callback(err, mail)
        }

        if (mail) callback(null, mail)
    }

    parseAttachments(connection, callback) {

        /**
         * parse attachments
         */
        var parts = imaps.getParts(this.message.attributes.struct)
        var message = this.message

        var bodyItem = null
        message.parts.forEach(function (item, index) {

            if (item && item["which"].indexOf("TEXT") > -1) {

                bodyItem = item
            }
        })

        var attachments = parts.filter(function (part) {
            return (part.type.indexOf('text') > -1 && part.subtype.indexOf('html') > -1 && !part.disposition) || (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')
        }).map(function (part) {

            return connection.getPartData(message, part)
                .then(function (partData) {
                    return partData
                });
        })

        var promise = Promise.all(attachments)

        promise.then((attachments) => {
            callback(null, attachments, bodyItem ? bodyItem.body : null)
        }).catch(callback)
    }

    save(mailBackend, connection, run_info, callback) {

        if (this.saved) return callback()

        var that = this

        this.parse(connection, (err, mail) => {

            if (err) return callback({
                mail: mail ? mail.messageId : null,
                err: parseError(err),
                at: "parsing"
            })

            var messageId = mail.messageId[0]

            mail.runInfo = run_info

            mailBackend.saveInfo(mail, (err, exists) => {

                if (err) {
                    // TODO: log here
                    return callback({
                        mail: mail.messageId,
                        err: parseError(err),
                        at: "saving"
                    })
                }

                if (exists) {
                    that.saved = true
                    return callback(null, [messageId, true])
                }

                that.parseAttachments(connection, (err, attachments, body) => {

                    if (err) {
                        // TODO: log here
                        return callback({
                            mail: mail.messageId,
                            err: parseError(err),
                            at: "parsing-attachments"
                        })
                    }

                    for (var i = 0; i < mail.attachments.length; i++) {
                        mail.attachments[i].data = attachments[i]
                    }

                    mail.body.data = body

                    mailBackend.saveBodyAndAttachments(mail, (err) => {

                        if (err) {
                            // TODO: log here
                            return callback({
                                mail: mail.messageId,
                                err: parseError(err),
                                at: "saving-attachments"
                            })
                        }

                        callback(null, [messageId, false, true])

                        // remove mail object for GC
                        mail = null
                    })
                })
            })
        })
    }

}

module.exports = MailObject
