var imaps = require('imap-simple');

var config = {
    imap: {
        user: 'morningnotes@ivp.in',
        password: 'valley@987654',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};

imaps.connect(config).then(function (connection) {

    connection.openBox('INBOX').then(function () {

        // Fetch emails from the last 24h
        var delay = 1 * 24 * 3600 * 1000;
        var yesterday = new Date();
        yesterday.setTime(Date.now() - delay);
        yesterday = yesterday.toISOString();
        var searchCriteria = [
            ['SINCE', yesterday]
        ];
        var fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
        };

        // retrieve only the headers of the messages
        return connection.search(searchCriteria, fetchOptions);
    }).then(function (messages) {

        console.log("got msgs")
        console.log(messages)

        messages.forEach(function (message, index) {

            var encodingUsedInHtml = '',
                charsetUsedInHtml = '';

            var parts = imaps.getParts(message.attributes.struct);
            var curAttach = [],
                currParts = [],
                htmlCount = 0;
            currParts = parts.filter(function (part) {
                //                        return (part.type.indexOf('text') > -1 && !part.disposition) || (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT');
                return (part.type.indexOf('text') > -1 && part.subtype.indexOf('html') > -1 && !part.disposition) || (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT');
            });
            // console.log(currParts)
            curAttach = currParts.map(function (part) {
                return connection.getPartData(message, part)
                    .then(function (partData) {

                        var isAttachment = false;

                        if (part.disposition && part.disposition.type && part.disposition.type.toUpperCase() === "ATTACHMENT")
                            isAttachment = true;

                        /*
                        if (!isAttachment) 

                        console.log({
                            filename: (part.disposition && part.disposition.params.filename) ? part.disposition.params.filename : (isAttachment ? 'bodyAttach' : 'body') + '.html', //+ message["seqNo"]
                            data: partData,
                            header: message["parts"],
                            uid: message["attributes"]["uid"],
                            arrivalDate: message["attributes"].date
                        })
                        */
                    });
            })

        })

        var attachments = [];

        // messages.forEach(function (message) {
        //     var parts = imaps.getParts(message.attributes.struct);
        //     attachments = attachments.concat(parts.filter(function (part) {
        //         return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
        //     }).map(function (part) {
        //         // retrieve the attachments only of the messages with attachments
        //         return connection.getPartData(message, part)
        //             .then(function (partData) {
        //                 return {
        //                     filename: part.disposition.params.filename,
        //                     data: partData
        //                 };
        //             });
        //     }));
        // });

        return Promise.all(attachments);
    }).then(function (attachments) {
        // console.log(attachments);
        // =>
        //    [ { filename: 'cats.jpg', data: Buffer() },
        //      { filename: 'pay-stub.pdf', data: Buffer() } ]
    });
});