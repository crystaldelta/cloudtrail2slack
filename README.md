# CloudTrail to Slack (via Cloudwatch Logs)

Handles sending CloudTrail events that you are interested in to Slack. This reads from CloudWatch Logs (vs SNS+S3).

Similar to
https://github.com/auth0/cloudtrail-slack

### Installation

1. Modify config.js with the settings you would like (see below)
2. Deploy to AWS Lambda
  * Node 4.3
3. Associate the CloudWatch Logs group containing CloudTrail events

### Testing Locally
```
node runLocal.js
```

### Configuration

1. Go to Slack and add a bot integration
2. cloudtrail-icon.png for the bot image in Slack
3. Get the token and put it into the config/config.js
4. Specify the name of the channel to post messages to in config/config.js

### Deploying to AWS

```
# Prepare code zip file
rm cloudtrail2slack.zip
zip -rq cloudtrail2slack.zip .

# create it
aws lambda create-function --function-name Cloudtrail2Slack --runtime nodejs4.3 --role xxxx --handler Cloudtrail2Slack.handler --zip-file file://cloudtrail2slack.zip --profile xxxx --timeout 30 --memory-size 256

# update it
aws lambda update-function-code  --function-name Cloudtrail2Slack --zip-file fileb://cloudtrail2slack.zip
```