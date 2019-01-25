
var kafka = require('kafka-node');
var Client = kafka.Client;
var Producer = kafka.Producer;

var State = require('../enums/NodeState').NodeState;

class Kafka {

    constructor(clientname, name, config) {

        this.clientname = clientname;

        this.name = name

        this.config = config;

        /**
         * kafka client
        */
        this.client = null;

        /**
         * kafka producer
        */
        this.producer = null;

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

        if (this.state === State.INITIALIZED) return callback(null, true);

        /**
         * already marked for Starting
        */
        if (this.state === State.STARTING) {

            var that = this;

            this.producer.once('ready', callback);

            this.producer.once('error', callback);

            return;
        }

        this.state = State.STARTING;

        var kafkaConfig = this.config;

        // console.log(' subscription, %j', kafkaConfig)

        var id = [this.clientName, this.name, new Date().valueOf()].join("_");

        this.client = new Client(kafkaConfig.client.zookeeper, id);

        this.producer = new Producer(this.client, kafkaConfig.options);

        var that = this;
        this.producer.on('ready', function () {

            that.state = State.INITIALIZED;
            callback(null, true);
        });

        this.producer.on('error', function (err) {

            that.state = State.ERRORED;
            callback(err);
        })
    }

    disconnect() {

        /**
         * if its already closed
        */
        if (this.state === State.CLOSED) return;

        /**
         * if its starting
        */
        if (this.state === State.STARTING) {

            var that = this;

            that.connect(function () {

                that.disconnect();
            })

            return;
        };

        if (this.producer)
            this.producer.close();

        if (this.client)
            this.client.close();

        this.state = State.CLOSED;
    }

    publish(payload, options, callback) {

        // console.log(" [kafka-producer] subscription changed: user: %s, state: %s", this.username, state)

        if (typeof options === "function") {

            callback = options;
            options = {}
        }

        var _on_error = function (err, callback) {

            console.log(err);

            return callback(err)
        }

        const clientname = this.clientname;

        var that = this;
        this.connect(function (err) {

            if (err) return _on_error(err, callback);

            var producer = that.producer;

            if (!payload.length) return callback("Invalid payload, not an array or no item to publish");

            console.log("  - payload: %j", payload)

            producer.send(payload, function (err) {

                console.log(" send subscription, err: %s", err);

                if (err) return _on_error(err, callback);

                callback(null, true);
            });
        });
    }
};

module.exports = Kafka
