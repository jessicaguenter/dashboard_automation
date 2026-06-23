function runTuesdayReports() {
  // Runs Tuesday evening, so Accounting has time to do final data processing for the last week.
  for (report of [CASHFLOW, P_AND_L]) fetchAndInputQBReport(report);
  fetchAndInputAllBillPayments(BILL_PAYMENTS);
  updateLastUpdatedDate();
}
function runSundayReports() {
  // DO NOT RUN MANUALLY UNLESS ACCOUNTING QUERY BREAKS. Runs on Sunday morning. Accounts data needs to be point in time, as historic data is not preserved. Hubspot objects are aways up to date, and can be pulled immediately.
  fetchAndInputAccounts(ACCOUNTS);
  // updateAccountsUpdatedDate();
}
function runDailyAccountReports() {
  // DO NOT RUN MANUALLY UNLESS ACCOUNTING QUERY BREAKS. Runs every morning. Accounts data needs to be point in time, as historic data is not preserved. Hubspot objects are aways up to date, and can be pulled immediately.
  testFetchAndInputAccounts(DAILY_ACCOUNTS);
  updateAccountsUpdatedDate();
}
function runDailyReports1() {
  for (report of [CASHFLOW, P_AND_L]) fetchAndInputQBReport(report);
  fetchAndInputAllBillPayments(BILL_PAYMENTS);
  fetchAndInputHavocInvoices(HAVOC_INVOICES);
}
function runDailyReports2() {
  fetchHubspotObjects();
}
function runDailyReports3() {
  fetchAllAssociations();
  // getAcctDetailsById();
}
function runDailyReports4() {
  fetchCustomerIncome(INCOME_BY_CUSTOMER);
  updateLastUpdatedDate();
}
function runCashFlow() {
  // Manually run in case data needs to be re-fetched.
  fetchAndInputQBReport(CASHFLOW);
  updateLastUpdatedDate();
}
function runPAndL() {
  // Manually run in case data needs to be re-fetched.
  fetchAndInputQBReport(P_AND_L);
  // updateLastUpdatedDate();
}
// function runVendors(){ //Manually run in case data needs to be re-fetched. Vendors is wrong item to fetch, fetching billpayments instead
//   fetchAndInputQBReport(VENDORS);
//   updateLastUpdatedDate();
// }

function runVendors() {
  fetchAndInputQBReport(BILL_PAYMENTS);
  updateLastUpdatedDate();
}

function runHubspot() {
  //Manually run in case data needs to be re-fetched.
  fetchHubspotObjects();
  updateLastUpdatedDate();
}

function runAccounts() {
  fetchAndInputAccounts(ACCOUNTS);
}
function runBillPayments() {
  fetchAndInputAllBillPayments(BILL_PAYMENTS);
}

function fetchAllAssociations() {
  for (report of [
    DEAL_LINEITEM_ASSOC,
    COMPANY_DEAL_ASSOC,
    CONTACT_DEAL_ASSOC,
    COMPANY_CONTACT_ASSOC,
    CONTACT_CONVERSATION_ASSOC,
    DEAL_INVOICE_ASSOC,
  ])
    fetchAssociations(report);
}
