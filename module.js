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
    .option('-m, --module <string>', 'module')

    .parse(process.argv);

if (!program.clientname) return help("Do specify a valid clientname")

if (!program.module) return help("Do specify a valid module name")

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

var MailBackend = require('./mail-backends/MailBackend')
var Subscriber = require('./pubsub/Subscriber')

const mailBackend = new MailBackend(program.clientname, properties.path())
const subscriber = new Subscriber(program.clientname, properties.path().pubsub)

switch (properties.path().mail.type) {

    case 'imap':
        var IMAP = require('./mail-adapters/imap')
        mailAdapter = new IMAP(program.clientname, properties.path().mail, mailBackend)
        break
}

mailBackend.init((err) => {

    if (err) return console.log(err)

    console.log(fixColors(colors.green(" + [" + program.module + "]")))
    console.log(properties.path()[program.module])

    var Module = require('./modules/Module')

    var module = new Module(program.module, program.clientname, properties.path()[program.module]).setSubscriber(subscriber)
})