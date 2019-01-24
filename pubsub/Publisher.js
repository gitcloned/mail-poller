class Publisher {

    constructor(clientname, config) {

        this.clientname = clientname

        this.agent = null

        switch (config.type) {

            case 'kafka':
                var Agent = require('./type/Kafka')
                this.agent = new Agent(clientname, config)
                break

            case 'redis':
                var Agent = require('./type/Redis')
                this.agent = new Agent(clientname, config)
                break

            case 'zeromq':
                var Agent = require('./type/ZeroMQ')
                this.agent = new Agent(clientname, config)
                break
        }
    }

    publish(topic, message, callback) {

        this.agent.publish(topic, message, callback)
    }
}

module.exports = Publisher