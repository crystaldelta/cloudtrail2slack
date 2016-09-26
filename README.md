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
rm cloudtrail2slack.zip; zip -rq cloudtrail2slack.zip .

# create it
aws lambda create-function --function-name Cloudtrail2Slack --runtime nodejs4.3 --role arn:aws:iam::xxxxxx:role/lambda_basic_execution --handler cloudtrail2slack.handler --zip-file fileb://cloudtrail2slack.zip --timeout 45 --memory-size 128

# update the created function to enable CloudWatch Logs triggers
# example filter
{ ($.eventName != "Describe*") &&  ($.eventName != "List*") && ($.eventName != "Get*") && ($.eventName != "Discover*")  && ($.eventName != "BatchCheckLayerAvailability") && ($.eventName != "AssumeRoleWithWebIdentity") }

# note that this filter can significantly cut the number of lambda invocations compared with using ignoreConfig.js values
# ignoreConfig.js can be used for non-bulk operations or for more complex items

# update it
aws lambda update-function-code  --function-name Cloudtrail2Slack --zip-file fileb://cloudtrail2slack.zip
```