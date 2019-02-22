var Poller = require('../mail-pollers/Poller')
const format = require("string-template")
const async = require("async")
const Mail = require("../Mail")

class Module {

    constructor(name, clientname, config) {

        this.name = name
        this.config = config
        this.clientname = clientname

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
            const clientname = this.clientname

            console.log("subscribing on topic: %s", topic)

            subscriber.subscribe(topic, (err, message) => {

                if (err) {
                    return console.log("error occurred while getting message over topic, err: %s", err.toString())
                }

                console.log(' [%s] got message of client {%s}', name, message.clientname)
		console.log(message.toString())

		try {
		    message = JSON.parse(message)
                } catch(err) {
                   return  console.log("error occurred while parsing message over topic, err: %s", err.toString())
                }

                console.log(message.mails.toString())

                var task = (mail, next) => {

                    return next(null, async.reflect(function (callback) {
                        new Mail(clientname, mail).fetch(mailBackend, callback)
                    }))
                }

                /**
                 * save mail objects
                 */
                async.map(message.mails, task, (err, tasks) => {

                    async.parallelLimit(tasks, 10, (err, results) => {

                        if (err) {
                            console.log(" error while fetching mails for messages, err: %s", err)
                        } else {

                            if (!err && clientname === message.clientname)
                                handler.handle({
                                    clientname: clientname,
                                    mails: results,
                                    run: message.run
                                })
                        }
                    })
                })
            })
        }

        return this
    }

    setPoller(poller) {

        if (this.topic_exists) {

            var publisher = this.publisher
            const topic = this.topic
            const publish = this.publish
            const clientname = this.clientname

            poller.on('mails', (saved_mails, existing_mails, run_info) => {

                var mails = []

                if (publish === "all")
                    mails = saved_mails.concat(existing_mails)
                else if (this.publish === "new_mails_only")
                    mails = saved_mails

                if (mails.length) {

                    publisher.publish(topic, {
                        clientname: clientname,
                        mails: mails,
                        run: run_info
                    }, (err) => {
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
