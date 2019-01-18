
var Logger = require('./Logger');

module.exports.initialize = function (logging, flags) {

    return function (next) {

        var config = null, logger = null;

        flags = flags || {};

        if (logging) {

            var type = logging.type;
            config = logging[type];
            
            if (flags.verbose) {
                config.verbose = logging.verbose;
            }

            switch (type) {

                case 'bunyan':

                    console.log(' [log] type: %s', type);
                    logger = require('./lib/type/bunyan').initialize(config);
                    break;

                default:
                    logger = console;
            }
        }

        /**
         * Map it to console object only
         */
        console.logger = new Logger(logger || console.log);

        next();
    }
};