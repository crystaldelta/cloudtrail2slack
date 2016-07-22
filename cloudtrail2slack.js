var AWS = require('aws-sdk')
var zlib = require('zlib')
var https = require('https')
var util = require('util')

var config = require('./config/config')
var ignoreConfig = require('./config/ignoreConfig')

// merge ignore into main config at runtime
for (var attrname in ignoreConfig) { config[attrname] = ignoreConfig[attrname] }

exports.handler = function (event, context) {

    var logger = getLogger()

    logger.info(event)

    var payload = new Buffer(event.awslogs.data, 'base64')
    var result = zlib.gunzipSync(payload)
    var result_parsed = JSON.parse(result.toString('ascii'))

    var parsedEvents = result_parsed.logEvents.map(function(logEvent) {
        return parseEvent(logEvent, result_parsed.logGroup, result_parsed.logStream)
    })

    postEvents(parsedEvents, function(err) {
      if(err) {
        logger.error(err)
        return context.done(err)
      }
      logger.info('all done')
      return context.done(null)
    })

    // converts the event to a valid JSON object with the sufficient infomation required
    function parseEvent(logEvent, logGroupName, logStreamName) {
        return {
            // remove '\n' character at the end of the event
            message: logEvent.message.substring(0, logEvent.message.length - 1),
            logGroupName: logGroupName,
            logStreamName: logStreamName,
            timestamp: new Date(logEvent.timestamp).toISOString()
        }
    }

    function postEvents(parsedEvents, callback) {
        for(var i = 0; i < parsedEvents.length; i++) {
            try {
              var message = {}
              try {
                message = JSON.parse(parsedEvents[i].message)
              } catch(err) {
                message = JSON.parse(parsedEvents[i].message + "}")
              }

              logger.info('Processing: ', JSON.stringify(message))

              if(isIgnoreEvent(message)) {
                continue
              }

              var postData = prepareSlackMessage(message)
              logger.info('Posting', postData)

              var options = {
                  method: 'POST',
                  hostname: 'hooks.slack.com',
                  port: 443,
                  path: config.slack.path
              }

              var req = https.request(options, function(res) {
                res.setEncoding('utf8')
                res.on('end', () => {
                  return callback()
                })
              })

              req.on('error', function(e) {
                logger.error('problem with request: ' + e.message)
                return callback(e)
              })

              req.write(util.format("%j", postData))
              req.end()

            } catch(err) {
                logger.error('Error: ', err)
                logger.error('Message: ', parsedEvents[i])
                return callback(err)
            }
        }
    }

    /*
     * Prepares and formats the slack message and returns the correct Slack structure as per https://api.slack.com/incoming-webhooks
     */
    function prepareSlackMessage(message) {
      var text = "Event " + message.eventName +
                " performed by type " + message.userIdentity.type +
                " who is " +  ((message.userIdentity.type === "IAMUser") ? message.userIdentity.userName : message.userIdentity.principalId) +
                " via " + message.eventType +
                " in region " + message.awsRegion +
                " from " + message.sourceIPAddress +
                " at " + message.eventTime

      var postData = {
          "username": "CloudTrail Logs",
          "text": text
      }

      // override the default WebHook channel if it is provided
      if(config.slack.channel) {
        postData.channel = config.slack.channel
      }

      return postData
    }

    /*
     * Based on the config provided, this will determine if this event should be sent to Slack or ignored
     */
    function isIgnoreEvent(message) {

      if(config.ignoredEvents.indexOf(message.eventName) > -1) {
        logger.debug(message.eventName, " being ignoring based on ignoredEvent ")
        return true
      }

      if(config.ignoredUsers.indexOf(message.userIdentity.principalId) > -1) {
        logger.debug("ignoring based on user ", message)
        return true
      }

      var ignoreRegexResult = false
      config.ignoredEventsRegex.forEach(function (regex) {
        if(regex.test(message.eventName)) {
          logger.debug(message.eventName + ' did match regex ' + regex + ' so this event is ignored')
          ignoreRegexResult = true
        } else {
          logger.debug(message.eventName + ' did not match regex ' + regex)
        }
      })
      if(ignoreRegexResult === true) {
        return true
      }

      return false
    }

    // will convert to bunyan
    function getDevLogger() {
      return {
        silly: console.log,
        debug: console.log,
        info: console.log,
        warn: console.log,
        error: console.error
      }
    }

    // will convert to bunyan
    function getLogger() {
      return {
        silly: function(){},
        debug: function(){},
        info: console.log,
        warn: console.log,
        error: console.error
      }
    }


}
