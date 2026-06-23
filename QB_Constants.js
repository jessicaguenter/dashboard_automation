const QUICKBOOKS_URL = "https://quickbooks.api.intuit.com/v3/company/"; // Quickbooks Production API. Ensure that QBO_CLT_ID, QBO_CLT_SECRET, and QBO_REALM_ID fields in project properties are updated to the production workspace, and that the application is re-authenticated.
// const QUICKBOOKS_URL = "https://sandbox-quickbooks.api.intuit.com/v3/company/" // Quickbooks Sandbox API. Ensure that QBO_CLT_ID, QBO_CLT_SECRET, and QBO_REALM_ID fields in project properties are updated to the test workspace, and that the application is re-authenticated.
const P_AND_L_NAME = "ProfitAndLoss";
const ACCOUNTS_NAME = "Accounts";
const P_AND_L_URI_PATH = "/reports/ProfitAndLoss";
const MAX_RESULTS = 1000;
const DAYS_IN_WEEK = 7;
const QB_SLEEP_DURATION = 120;
const DATE_BUFFER = 4;
const PERIODIC = 1;
const NOT_PERIODIC = 0;
const YEARS_TO_FETCH = 2;
const MONTH_START = 0;
const WEEK_START = 0;
const START_POSITION = 1;

const ACCOUNTS = Object.freeze({
  name: "Accounts",
  queryString: accountsQueryString,
  uriPath: "",
  mapItems: mapAccountsItem,
});
const DAILY_ACCOUNTS = Object.freeze({
  name: "Daily_Accounts",
  queryString: accountsQueryString,
  uriPath: "",
  mapItems: mapAccountsItem,
});
const BILL_PAYMENTS = Object.freeze({
  name: "BillPayments",
  queryString: billPaymentsQueryString,
  uriPath: "",
  mapItems: mapBillPaymentsItem,
});
const P_AND_L = Object.freeze({
  name: "ProfitAndLoss",
  queryString: reportsQueryString,
  uriPath: "/reports/ProfitAndLoss",
  mapItems: mapReportsItem,
});
const CASHFLOW = Object.freeze({
  name: "CashFlow",
  queryString: reportsQueryString,
  uriPath: "/reports/CashFlow",
  mapItems: mapReportsItem,
});
const VENDORS = Object.freeze({
  name: "Vendors",
  queryString: reportsQueryString,
  uriPath: "/reports/VendorExpenses",
  mapItems: mapReportsItem,
});
const TRANSACTIONS = Object.freeze({
  name: "TransactionList",
  queryString: reportsQueryString,
  uriPath: "/reports/TransactionList",
  mapItems: mapReportsItem,
});
const HAVOC_INVOICES = Object.freeze({
  name: "HavocInvoices",
  queryString: havocInvoiceQueryString,
  uriPath: "",
  mapItems: mapInvoiceItem,
});
// const TRANSACTION_DETAILS = Object.freeze({
//   name: "TransactionDetailByAccount",
//   queryString: transactionDetailQueryString,
//   uriPath:"/reports/TransactionDetailByAccount",
//   mapItems: mapTransactionItem,
// })

const INCOME_BY_CUSTOMER = Object.freeze({
  name: "CustomerIncome",
  queryString: reportsQueryString,
  uriPath: "/reports/CustomerIncome",
  mapItems: mapSalesByCustomer,
});
