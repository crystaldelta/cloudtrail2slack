module.exports = {
  ignoredEvents: [
    'AssumeRoleWithWebIdentity',
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

  ignoredUsers: [],

  ignoredErrorCodes: [
    'ResourceNotFoundException',
    'ValidationException'
  ]
}
