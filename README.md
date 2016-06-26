# CloudTrail to Slack (via Cloudwatch Logs)

Handles sending CloudTrail events that you are interested in to Slack. This reads from CloudWatch Logs (vs SNS+S3).

### Installation

1. Modify config.js with the settings you would like
2. Deploy to lambda
  * Node 4.3
3. Associate the CloudWatch Logs group containing CloudTrail events

### Testing Locally
```
node runLocal.js
```