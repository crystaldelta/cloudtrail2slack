var cwlToSlack = require('./cloudtrail2slack')

// simple emulation of lambda context
var context = {
  done: function (err) {
    console.log('context is done', err)
  }
}

// var event = require('./event-folder/example')
var event = require('./event-folder/ignoredAndNotIgnored')
cwlToSlack.handler(event, context)
