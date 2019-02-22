var Poller = require('../mail-pollers/Poller')
const format = require("string-template")

class Module {

    constructor(name, clientname, config) {

        this.name = name
        this.config = config

        this.publisher = null
        this.subscriber = null

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

    setPublisher(publisher) {
        this.publisher = publisher
        return this
    }

    setSubscriber(subscriber, mailBackend, handler) {
        this.subscriber = subscriber

        if (this.topic_exists) {

            const topic = this.topic
            const name = this.name

            console.log("subscribing on topic: %s", topic)

            subscriber.subscribe(topic, (err, message) => {
                console.log(' [%s] got message, err: %s', name, err)
                console.log(message.toString())

                if (!err)
                    handler(message)
            })
        }

        return this
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

                    publisher.publish(topic, mails, (err) => {
                        console.log(" published to topic (%s), err: %s", topic, err)
                    })
                }

                mails = null
            })
        }

        return this
    }
}

module.exports = Module