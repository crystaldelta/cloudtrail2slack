module.exports = {
  ignoredEvents: [
    "CheckMfa",
    "LookupEvents",
    "ConsoleLogin",
    "CreateLogStream"
  ],

  ignoredEventsRegex: [
    /List.*/,
    /Get.*/,
    /Describe.*/
  ],

  ignoredUsers: []
}
