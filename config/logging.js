
function errorSerializer(err) {
    
    if (!err) return null;
    
    if (typeof err === "string") return err;

    return err.toString();
};

module.exports.get = function () {

    /**
     * read the .env file
     */
    require('dotenv').config()

    var env = null;
    
    try {
        /**
         * load the env from .env file
         */
        env = require('./env/' + process.env.ENVIRONMENT);
    } catch (e) {
        
        env = require('./env/dev');
    }
    
    
    return {

        type: "bunyan",

        bunyan: {
            name: 'mail-parser',
            src: false,
            ringBuffer: env.logging.ringBuffer
                            ? env.logging.ringBuffer : false,
            
            
            serializers: {
                err: errorSerializer
            }
        },
        
        verbose: {
            user: true
        }
    };
};
