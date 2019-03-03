
# mail-poller
Simple project to sniff mails and take lot of action on it, like running a workflow, or attaching sentiment.

![flow](https://github.com/gitcloned/mail-poller/raw/master/resources/images/Flow.PNG)

Basic Usage:

```javascript
node poller -c <clientname> --config poller.properties
```

Reads the poller config from properties file and start polling mailbox. You can check the sample properties file [here](https://raw.githubusercontent.com/gitcloned/mail-poller/master/poller.properties)

It starts multiple pollers as defined in properties file, and dumps mail body/info/attachment to the backend of choice. 

After persisting mail it then drop message on a pubs queue, like zeroMQ, which then informs the handler.

To start a handler module:

```javascript
node module -c <clientname> -m <module_name> --config poller.properties --handler <path_to_your_handler.js>
```

Handler file should be a valid nodejs script which should export a method named '**handle**', like:

```javascript
module.exports.handle = function (mails) {
	// write your code here   
}
```
