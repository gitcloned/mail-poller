
class Logger {

    constructor (logger) {

        this.logger = logger;
    }

    log (moduleName, log) {

        if (typeof moduleName !== "string") return;

        if (typeof log !== "object") return;

        log.mod = moduleName;

        this.logger.info(log);
    }
}

module.exports = Logger;