class Publisher {

    constructor(clientname, config) {

        this.clientname = clientname

        this.agent = null

        switch (config.type) {

            case 'kafka':
                var Agent = require('./type/KafkaPub')
                this.agent = new Agent(clientname, "kafka", config)
                break

            case 'redis':
                var Agent = require('./type/RedisPub')
                this.agent = new Agent(clientname, "redis", config)
                break

            case 'zeromq':
                var Agent = require('./type/ZeroMQPub')
                this.agent = new Agent(clientname, "zeromq", config)
                break
        }
    }

    publish(topic, message, callback) {

        this.agent.publish(topic, message, callback)
    }
}

module.exports = Publisher