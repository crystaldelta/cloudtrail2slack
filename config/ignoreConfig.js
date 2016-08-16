module.exports = {
  ignoredEvents: [
    'BatchCheckLayerAvailability',
    'CheckMfa',
    'ConsoleLogin',
    'CreateLogStream',
    'DiscoverPollEndpoint',
    'Decrypt',
    'LookupEvents',
    'SubmitContainerStateChange',
    'SubmitTaskStateChange',
    'TestMetricFilter',
    'UploadLayerPart'
  ],

  ignoredEventsRegex: [
    /List.*/,
    /Get.*/,
    /Describe.*/
  ],

  ignoredUsers: []
}
