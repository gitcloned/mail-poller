
var bunyan = require('bunyan'),
    path = require('path'),
    RingBuffer = require('./RingBuffer'),
    bunyantcp = require('bunyan-logstash-tcp');

var $ROOT_DIR = path.dirname(require.main.filename);

/*
  override the default console log here
*/
var _override_console = function (logger) {

    var _debug = console.debug;
    console.debug = function () {

        //console.log(' hooked debug')
        try {
            logger.debug.apply(logger, arguments);
        } catch (e) { }
    };

    var _info = console.info;
    console.info = function () {

        //console.log(' hooked info')
        try {
            logger.info.apply(logger, arguments);
        } catch (e) { }
    };

    var _warn = console.warn;
    console.warn = function () {

        //console.log(' hooked warn')
        try {
            logger.warn.apply(logger, arguments);
        } catch (e) { }
    };

    var _error = console.er;
    console.err = function () {

        //console.log(' hooked error')
        try {
            logger.error.apply(logger, arguments);
        } catch (e) { }
    };
};

module.exports.initialize = function (config) {

    config = config || {};

    var name = config.name || "position-aggregator"
        , src = config.src === true ? config.src : false
        , serializers = config.serializers || bunyan.stdSerializers
        , ringBuffer = config.ringBuffer === false ? false : (typeof ringBuffer === "number" ? ringBuffer : 200)
        , streams = config.streams || [{
            type: 'rotating-file',
            path: path.join('.logs/bunyan.log'),
            period: '1d',   // daily rotation
            count: 3        // keep 3 back copies
        }];

    if (ringBuffer) {

        ringBuffer = new RingBuffer({ limit: ringBuffer });

        streams.push({
            level: 'debug',
            type: 'raw',    // use 'raw' to get raw log record objects
            stream: ringBuffer
        });

        // bunyan logs route
        // require('./view/logview')(ringBuffer, app);
    } else {

        /*
        app.use("/sys/logs", function (req, res, next) {

            return res.err("Ring Buffer 'ringBuffer' not enabled, enable to see logs through this route.");
        });
        */
    }

    /*
    var debug = e.config().developer.debug;

    if (debug.core && debug.core.enabled && debug.core.type === "node-monkey") {

        console.logm('    | piping bunyan logs to node monkey')

        streams.push({
            level: 'debug',
            stream: e.debugger().nomo.stream
        });
    }
    */

    var flume = config.flume;

    if (flume && flume.enabled) {

        streams.push({
            level: 'info',
            type: "raw",
            stream: bunyantcp.createStream(flume).on('error', function (err) {
                console.debug('error connecting to flume, err: %s', err);
            })
        });
    }

    var fluent = config.fluent;

    if (fluent && fluent.enabled) {

        var FluentLogger = require('./bunyan-transport/Fluent');

        var sender = require('fluent-logger').createFluentSender(name
            , fluent.server);

        var level = fluent.level || "trace";

        streams.push({
            level: level,
            type: "raw",
            //stream: sender.toStream(label)
            stream: new FluentLogger(level, sender)
        });

        /*
        fluent.levels = fluent.levels || {
            'error': true,
            'warn': true,
            'info': true,
            'debug': true
        }

        for (var level in fluent.levels) {
            if (fluent.levels.hasOwnProperty(level)) {

                if (!fluent.levels[level]) continue;

                var label = typeof fluent.levels[level] === "string"
                                ? fluent.levels[level] : level;

                streams.push({
                    level: level,
                    type: "raw",
                    //stream: sender.toStream(label)
                    stream: new FluentLogger(level, sender)
                });
            }
        }
        */
    }

    /*
     create logger
    */
    var log = bunyan.createLogger({
        name: name,
        src: src,
        serializers: serializers,
        streams: streams
    });

    _override_console(log);

    console.info({ label: 'started' })

    /*
    e.logger = log;
    e.logf = {
        create: function (type, name, streams) {
            
            if (!config.verbose || !config.verbose[type]) streams = [];

            return bunyan.createLogger({
                name: name,
                src: src,
                serializers: serializers,
                streams: streams
            });
        }
    };
    */

    return log;
};