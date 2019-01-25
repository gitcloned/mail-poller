var zmq = require('zeromq')

var State = require('../enums/NodeState').NodeState;

class ZeroMQTopic {

    constructor (topic, config) {

        this.topic = topic

        this.config = config

        /**
         * zeromq producer
        */
       this.subscriber = zmq.socket('sub')

       /**
        * subscriber state
       */
       this._state = State.None;
    }

    connect(callback) {

        if (this.state === State.INITIALIZED) return callback(null, true)

        // console.log(" [zeromq] connecting (sub) at %s on topic %s", this.config.address, this.topic)

        this.subscriber.connect(this.config.address)
        this.subscriber.subscribe(this.topic)

        this.state = State.INITIALIZED

        callback(null)
    }

    disconnect() {

        /**
         * if its already closed
        */
        if (this.state === State.CLOSED) return

        this.state = State.CLOSED;
    }

    subscribe(options, callback) {

        // console.log(" [zeromq] subscribtion request on topic: %s", this.topic)

        if (typeof options === "function") {

            callback = options;
            options = {}
        }

        var _on_error = function (err, callback) {

            console.log(err);

            return callback(err)
        }

        var that = this;
        this.connect(function (err) {

            if (err) return _on_error(err, callback);

            // console.log(" [zeromq] subscribing on topic: %s", that.topic)

            that.subscriber.on('message', function(topic, message) {
                callback(null, message)
            })
        })
    }
}

class ZeroMQ {

    constructor(clientname, name, config) {

        this.clientname = clientname;

        this.name = name

        this.config = config;

        /**
         * zeromq subscribers
        */
        this.subscribers = {}

        /**
         * subscriber state
        */
        this._state = State.None;
    }

    get state() {
        return this._state;
    }

    set state(state) {

        if (state !== this.state)
            this._state = state;
    }

    connect(callback) {

        if (this.state === State.INITIALIZED) return callback(null, true)

        this.state = State.INITIALIZED
    }

    disconnect() {

        /**
         * if its already closed
        */
        if (this.state === State.CLOSED) return

        this.state = State.CLOSED;
    }

    subscribe(topic, options, callback) {

        // console.log(" [zeromq-producer] subscription changed: user: %s, state: %s", this.username, state)

        if (typeof options === "function") {

            callback = options;
            options = {}
        }

        var _on_error = function (err, callback) {

            console.log(err);

            return callback(err)
        }

        const clientname = this.clientname;

        if (this.subscribers[topic]) return this.subscribers[topic].subscribe(options, callback)

        this.subscribers[topic] = new ZeroMQTopic(topic, this.config)
        this.subscribers[topic].subscribe(options, callback)
    }
}

module.exports = ZeroMQ
