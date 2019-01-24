var Poller = require('../mail-pollers/Poller')
const format = require("string-template")

class Module {

    constructor(name, config, publisher) {

        this.name = name
        this.config = config

        this.publisher = publisher
        this.topic = format(this.config.pubsub.topic, {
            clientname: clientname.replace(/\s+/g, ''),
            name: this.name
        })
    }

    setPoller(poller) {

        poller.registerModule(this)

        var publisher = this.publisher
        const topic = this.topic

        poller.on('mail', (mails) => {

            publisher.publish(topic, mails, (err) => {
                console.log(" published, err: %s", err)
            })
        })
    }
}

module.exports = Module