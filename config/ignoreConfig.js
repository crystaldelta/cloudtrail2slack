module.exports = {
  ignoredEvents: [
    'AssumeRoleWithWebIdentity',
    'BatchCheckLayerAvailability',
    'BatchGetImage',
    'CheckMfa',
    'ConsoleLogin',
    'CreateLogStream',
    'DiscoverPollEndpoint',
    'Decrypt',
    'InitiateLayerUpload',
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
  ],

  compoundIgnores: [
    {
      eventName: 'CreateTable',
      user: 'bob',
      errorCode: 'ResourceInUseException'
    },
    {
      eventName: 'CreateLogGroup',
      user: 'bob',
      errorCode: 'ResourceAlreadyExistsException'
    }
  ]
}
