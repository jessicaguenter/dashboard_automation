const QB_CLIENT_ID =
  PropertiesService.getScriptProperties().getProperty("QBO_CLT_ID"); // Get from Quickbooks Developer Console
const QB_CLIENT_SECRET =
  PropertiesService.getScriptProperties().getProperty("QBO_CLT_SECRET"); // Get from Quickbooks Developer Console
const QB_BASE_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_SCOPE = "com.intuit.quickbooks.accounting";

const REDIRECT_URI =
  PropertiesService.getScriptProperties().getProperty("GS_REDIRECT_URI"); // Generate using the logRedirectUri() function mentioned at the end of this script

/**
 * Reset the authorization state for testing, or to disable application.
 */
function resetOAuth() {
  getQuickbooksService().reset();
}
/**
 * Tests the quickbooks service.
 */
const testQuickbooksService = () => {
  testService(getQuickbooksService());
};
/**
 * Tests the given service for a connection. If invalid, sends email alert to reauthenticate.
 */
const testService = (service) => {
  if (!service.hasAccess()) {
    Logger.log(
      "No access. Check your email to run the authorization process again.",
    );
    const authorizationUrl = service.getAuthorizationUrl();
    const subject = "Operations Automation Token Authentication Alert";
    const body = `No Access. Open the following URL to authorize the script: ${authorizationUrl}. This is an automated alert.`;
    emailAlert(subject, body);
    return false;
  }
  return true;
};
/**
 * Configures the Quickbooks service.
 */
function getQuickbooksService() {
  return OAuth2.createService("Quickbooks")
    .setAuthorizationBaseUrl(QB_BASE_AUTH_URL)
    .setTokenUrl(QB_TOKEN_URL)
    .setClientId(QB_CLIENT_ID)
    .setClientSecret(QB_CLIENT_SECRET)
    .setScope(QB_API_SCOPE)
    .setCallbackFunction("qbAuthCallback")
    .setParam("response_type", "code")
    .setParam("state", getStateToken("qbAuthCallback")) // function to generate the state token on the fly
    .setPropertyStore(PropertiesService.getScriptProperties());
}
/**
 * Handles the OAuth callback
 */
function qbAuthCallback(request) {
  const service = getQuickbooksService();
  const authorized = service.handleCallback(request);
  if (authorized) {
    Logger.log("Success!");
    return HtmlService.createHtmlOutput("Success!");
  } else {
    Logger.log("Denied!");
    return HtmlService.createHtmlOutput("Denied.");
  }
}
/**
 * Generates a State Token.
 */
function getStateToken(callbackFunction) {
  const stateToken = ScriptApp.newStateToken()
    .withMethod(callbackFunction)
    .withTimeout(120)
    .createToken();
  return stateToken;
}

/**
 * Logs the redirect URI. Run this function to get the REDIRECT_URI to be mentioned at the top of this script.
 */
function logRedirectUri() {
  Logger.log(getService().getRedirectUri());
}
