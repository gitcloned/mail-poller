var Poller = require('../mail-pollers/Poller')
const format = require("string-template")

class Module {

    constructor(name, clientname, config, publisher) {

        this.name = name
        this.config = config

        this.publisher = publisher

        this.topic = this.config.pubsub.topic
        this.topic_exists = this.topic ? true : false

        if (this.topic_exists) {

            this.topic = format(this.config.pubsub.topic, {
                clientname: clientname.replace(/\s+/g, ''),
                name: this.name
            })
        }

        this.publish = ["all", "new_mails_only"].indexOf(this.config.pubsub.publish) > -1 ? this.config.pubsub.publish : "new_mails_only"
    }

    setPoller(poller) {

        if (this.topic_exists) {

            var publisher = this.publisher
            const topic = this.topic
            const publish = this.publish

            poller.on('mails', (saved_mails, existing_mails) => {

                var mails = []

                if (publish === "all")
                    mails = saved_mails.concat(existing_mails)
                else if (this.publish === "new_mails_only")
                    mails = saved_mails

                if (mails.length) {

                    console.log(" publishing on topic: %s", topic)
                    console.log(mails)

                    publisher.publish(topic, mails, (err) => {
                        console.log(" published, err: %s", err)
                    })
                }

                mails = null
            })
        }

        return this
    }
}

module.exports = Module