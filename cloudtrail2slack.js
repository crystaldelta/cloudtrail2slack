var zlib = require('zlib')

var botkit = require('botkit')

var config = require('./config/config')
var ignoreConfig = require('./config/ignoreConfig')

var MAX_REQUEST_DETAIL = 2000

// merge ignore into main config at runtime
for (var attrname in ignoreConfig) {
  config[attrname] = ignoreConfig[attrname]
}

exports.handler = function (event, context) {
  var logger = getLogger()

  logger.info('Processing event: ', event)

  var payload = new Buffer(event.awslogs.data, 'base64')
  var result = zlib.gunzipSync(payload)
  var resultParsed = JSON.parse(result.toString('ascii'))

  var parsedEvents = resultParsed.logEvents.map(function (logEvent) {
    return parseEvent(logEvent, resultParsed.logGroup, resultParsed.logStream)
  })

  logger.debug('Creating slackbot')

  var controller = botkit.slackbot({
    debug: true
  })

  logger.debug('Spawning controller')

  var bot = controller.spawn({
    token: config.slack.token
  })

  logger.debug('Starting RTM')

  logger.debug('Now posting events')
  filterEvents(parsedEvents, function (err, result) {
    if (err) {
      logger.error(err)
      return context.done(err)
    }

    if (result.length === 0) {
      logger.info('all done - no messages to send')
      return context.done(null)
    }

    bot.startRTM(function (err, bot, payload) {
      if (err) {
        logger.error('Error!: ', err)
        return context.done(err)
      }

      for (var i = 0; i < result.length; i++) {
        bot.say(result[i])
      }

      logger.info('all done')
      bot.destroy()
      return context.done(null)
    })
  })

  // converts the event to a valid JSON object with the sufficient infomation required
  function parseEvent (logEvent, logGroupName, logStreamName) {
    return {
      // remove '\n' character at the end of the event
      message: logEvent.message.substring(0, logEvent.message.length - 1),
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      timestamp: new Date(logEvent.timestamp).toISOString()
    }
  }

  function filterEvents (parsedEvents, callback) {
    var messagesToSend = []
    for (var i = 0; i < parsedEvents.length; i++) {
      try {
        var message = {}
        try {
          message = JSON.parse(parsedEvents[i].message)
        } catch (err) {
          message = JSON.parse(parsedEvents[i].message + '}')
        }

        logger.info('Processing: ', JSON.stringify(message))

        if (isIgnoreEvent(message)) {
          logger.info('Ingoring that one :)')
          continue
        }

        var postData = prepareSlackMessage(message)

        logger.info('Posting', JSON.stringify(postData))

        messagesToSend.push(postData)
      } catch (err) {
        logger.error('Error: ', err)
        logger.error('Message: ', parsedEvents[i])
        return callback(err)
      }
    }
    return callback(null, messagesToSend)
  }

  /*
   * Prepares and formats the slack message and returns the correct Slack structure as per https://api.slack.com/incoming-webhooks
   */
  function prepareSlackMessage (message) {
    var text = '*' + message.eventName + '*' +
              ' performed by *' + message.userIdentity.type +
              '/' + ((message.userIdentity.type === 'IAMUser') ? message.userIdentity.userName : message.userIdentity.principalId) + '*' +
              ' via *' + message.eventType + '*' +
              ' in *' + message.awsRegion + '*' +
              ' from *' + message.sourceIPAddress + '*' +
              ' at *' + message.eventTime + '*'

    var attachments = []

    if (message.errorCode) {
      attachments.push({ text: '*Error Code*: ' + message.errorCode, color: 'danger' })
      attachments.push({ text: '*Error Message*: ' + message.errorMessage, color: 'danger' })
    }

    if (message.requestParameters) {
      if (message.requestParameters.bucketName) {
        attachments.push({ text: 'bucketName: ' + message.requestParameters.bucketName })
      }

      if (message.requestParameters.id) {
        attachments.push({ text: 'id: ' + message.requestParameters.id })
      }

      if (message.requestParameters.groupName) {
        attachments.push({ text: 'groupName: ' + message.requestParameters.groupName })
      }

      var requestDetails = JSON.stringify(message.requestParameters).trim()
      var requestDetailsLength = requestDetails.length > MAX_REQUEST_DETAIL ? MAX_REQUEST_DETAIL : requestDetails.length
      text += '\n_Request Params_ => ```' + requestDetails.substring(0, requestDetailsLength) + '```'
      if (requestDetailsLength < requestDetails.length) {
        text += '\n (truncated details)'
      }
    }

    var postData = {
      'username': config.slack.name,
      'text': text,
      attachments: attachments
    }

    // override the default WebHook channel if it is provided
    if (config.slack.channel) {
      postData.channel = config.slack.channel
    }

    return postData
  }

  /*
   * Based on the config provided, this will determine if this event should be sent to Slack or ignored
   */
  function isIgnoreEvent (message) {
    // check if there are any errors to ignore
    if (message.errorCode && (config.ignoredErrorCodes.indexOf(message.errorCode) > -1)) {
      return true
    }

    if (config.ignoredEvents.indexOf(message.eventName) > -1) {
      logger.debug(message.eventName, ' being ignoring based on ignoredEvent ')
      return true
    }

    if (config.ignoredUsers.indexOf(message.userIdentity.principalId) > -1) {
      logger.debug('ignoring based on user ', message)
      return true
    }

    var ignoreRegexResult = false
    config.ignoredEventsRegex.forEach(function (regex) {
      if (regex.test(message.eventName)) {
        logger.debug(message.eventName + ' did match regex ' + regex + ' so this event is ignored')
        ignoreRegexResult = true
      } else {
        logger.debug(message.eventName + ' did not match regex ' + regex)
      }
    })

    if (ignoreRegexResult === true) {
      return true
    }

    return false
  }

  // will convert to bunyan
  function getLogger () {
    return {
      silly: function () {},
      debug: console.log,
      info: console.log,
      warn: console.log,
      error: console.error
    }
  }
}
