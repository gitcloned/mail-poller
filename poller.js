/**
 * Mail Poller
 * 
 */
function collect(val, memo) {
    memo.push(val);
    return memo;
}

function parseBoolean(val) {
    if (typeof val === "boolean") return val
    return null
}

function fixColors(str) {
    return unescape(
        escape(
            str
        )
        .replace(/\%1B/i, '\\u%1B')
        .replace('\\u', '')
    )
}

var help = function (msg) {

    console.log("\n")
    console.log(fixColors(colors.bgRed(msg)))
    console.log("\n")
    program.outputHelp();
}

var isValidMailProperties = function (config) {

    if (!config.user) {
        console.log("\n" + fixColors(colors.grey("Not a valid [mail] section, user not specified")))
        return false
    }

    if (!config.password) {
        console.log("\n" + fixColors(colors.grey("Not a valid [mail] section, password not specified")))
        return false
    }

    if (!config.host) {
        console.log("\n" + fixColors(colors.grey("Not a valid [mail] section, host not specified")))
        return false
    }

    return true
}

var isValidConfigFile = function (val) {

    if (!fs.existsSync(val)) {
        console.log("\n" + fixColors(colors.grey("File not found: " + val)))
        return false
    }

    var properties = PropertiesReader(val);
    if (!properties.path().mail) {
        console.log("\n" + fixColors(colors.grey("Not a valid property file, specify [mail] section")))
        return false
    }

    if (!properties.path().mail.type) {
        console.log("\n" + fixColors(colors.grey("Not a valid [mail] section, havent specified 'type'")))
        return false
    }

    if (['imap'].indexOf(properties.path().mail.type) == -1) {
        console.log("\n" + fixColors(colors.grey("Not a valid [mail.type] property, supports (imap)")))
        return false
    }

    if (!isValidMailProperties(properties.path().mail[properties.path().mail.type])) {
        return false
    }

    return properties
}

var program = require('commander');
var colors = require('colors');
var PropertiesReader = require('properties-reader');

const fs = require('fs')

program
    .version('1.0.0')
    .option('-c, --clientname <string>', 'clientname')
    .option('--config <file>', 'config file (property)', isValidConfigFile)
    .option('-l, --lookback [number]', 'lookback period in seconds', parseInt, 60)
    .option('-f, --fetch <items>', 'fields to fetch HEADER(FROM,TO..) TEXT', collect, "HEADER,TEXT".split(","))
    .option('--limit <n>', 'Limit of mails to process after fetch', parseInt, -1)
    .option('--unseen', 'Only unseen mails')
    .option('--mark-seen', 'Marked fetched mails as seen', parseBoolean, false)
    .option('-b, --box', 'Box name (INBOX, SENT ..)', 'INBOX')
    .option('-s, --search', 'Search criteria', '[]')
    .option('--watch', 'Run in watch mode', false)
    .option('-t, --test', 'Test mail connectivity')

    .parse(process.argv);

if (!program.clientname) return help("Do specify a valid clientname")

if (!program.config) return help("Do specify a valid mail config")

var properties = program.config

if (program.box) properties.set('mail.box', program.box)

if (program.search) {

    var modules = properties.path().modules

    for (var module in modules) {
        if (modules.hasOwnProperty(module) && modules[module] == 'true') {
            properties.set([module, 'mail', 'poller', 'search_criteria'].join('.'), program.search)
        }
    }
}

if (program.markSeen) properties.set(['mail', 'mark_seen'].join('.'), program.markSeen)

console.log("")

/**
 * initialize logger
 */
require('./logger/init').initialize(program.config.logging)(function () {

    console.log(fixColors(colors.gray("Logger started\n")))
});

var mailAdapter = null;
var MailBackend = require('./mail-backends/MailBackend')

const mailBackend = new MailBackend(program.clientname, properties.path())

switch (properties.path().mail.type) {

    case 'imap':
        var IMAP = require('./mail-adapters/imap')
        mailAdapter = new IMAP(program.clientname, properties.path().mail, mailBackend)
        break
}

mailBackend.init((err) => {

    if (err) return

    mailAdapter.connect().on('connect', () => {

        console.log('registering modules\n')

        var modules = properties.path().modules

        const registered_modules = []

        for (var module in modules) {
            if (modules.hasOwnProperty(module) && modules[module] == 'true') {

                try {

                    var Module = require('./modules/' + module)

                    /**
                     * create module and set mail adapter
                     */
                    registered_modules.push(new Module(properties.path()[module]).setPollerWithAdapter(mailAdapter))

                    console.log(fixColors(colors.green(" + [" + module + "]")))
                } catch (e) {

                    console.log(e)
                    console.log(fixColors(colors.bgRed("Unknown module specified '" + module + "'")))
                }
            }
        }

        console.log("")
    })
})