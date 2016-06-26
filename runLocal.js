var cwlToSlack = require('./cloudwatchLogsToSlack')

// simple emulation of lambda context
var context = {
  done: function (err) {
    console.log('context is done', err)
  }
}

var event = require('./event-folder/describefailure')
cwlToSlack.handler(event, context)
