function quickBooksRequest(url, service) {
  let data;
  try {
    data = quickbooksFetch(url, service);
  } catch (err) {
    const subject = "Quickbooks Integration API Error";
    emailAlert(subject, err.message);
    return;
  }
  // if data exists
  if (data) {
    Logger.log(data);
    return data;
  }
}

/**
 * Helper function that returns the QB Realm ID.
 */
function getRealmID_() {
  return PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
}

function fetchCustomerIncome(report, filter_year = 2021) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmID = getRealmID_();
  sheet = qbGetOrMakeSheet(report.name, NOT_PERIODIC);
  const headers = ["Year", "Customer Name", "CAD Income"];

  let startYear = filter_year;
  let endYear = new Date().getFullYear();
  let results = [];

  for (let year = startYear; year <= endYear; year++) {
    Logger.log("end year: " + endYear);
    let startDate = new Date(year, 0, 1);
    let endDate = new Date(year, 11, 31);

    if (year === endYear) {
      endDate = getLastSunday();
    }
    let startPos = START_POSITION;
    let next = true;

    while (next) {
      const url =
        QUICKBOOKS_URL +
        realmID +
        report.uriPath +
        report.queryString(startDate, endDate, startPos);
      // fetch exchange rate
      let data = quickBooksRequest(url, service);
      if (!data) return;
      let colItems = data.Rows.Row;

      for (const item of colItems) {
        if (item?.ColData && item?.ColData[1].value > 0)
          results.push([year, item.ColData[0].value, item.ColData[1].value]);
      }

      if (colItems.length < MAX_RESULTS) {
        next = false;
      } else {
        startPos += MAX_RESULTS;
        Utilities.sleep(QB_SLEEP_DURATION);
      }
    }
  }
  if (results.length > 0) {
    sheet.clear();
    addToSheet(sheet, headers, results);
  }
}

/**
 * Fetches standard QB report by API by calendar week, and inserts into spreadsheet. Returns in Company currency which is CAD at time of comment. Check in QBO account settings > Advanced
 */
function fetchAndInputQBReport(report) {
  // Setup function and services
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");

  // Stores data that will end up on the output sheet.
  let results = [];
  // Gets sheet, or creates and sets ups new sheet.
  sheet = qbGetOrMakeSheet(report.name, PERIODIC);

  // Get headers that are already on the sheet.
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  // loop for weeks in year from Jan 1 to previous week.
  let [today, startDate, endDate, week] = initializeDates(
    new Date().getFullYear() - YEARS_TO_FETCH,
  );
  let currYear = startDate.getFullYear();
  const quarters = getAllQuarters(startDate, today);
  const comingSaturday = getUpcomingSaturday(today);
  while (endDate <= comingSaturday) {
    week++;
    // check for year rollover
    const isYearEnd = endDate.getFullYear() > startDate.getFullYear();
    // if year rollover, set end date to Dec 31.
    if (isYearEnd) endDate = getYearEndDate(startDate);
    // get week data.
    fetchDataInRange(
      report,
      headers,
      results,
      startDate,
      endDate,
      "Week",
      week,
      service,
      realmId,
    );
    Utilities.sleep(150);
    // get quarter end date if it falls in the week, returns undefined if not
    const quarterEndDate =
      findIfQuarterEnd(startDate, endDate, quarters) ||
      (endDate.getTime() + 7 * 24 * 60 * 60 * 1000 >= today.getTime()
        ? getQuarterEndDate(startDate)
        : false);
    if (quarterEndDate) {
      const quarterStartDate = getQuarterStartDate(quarterEndDate);
      Logger.log(
        `Quarter end. Start Date: ${quarterStartDate}, End Date: ${quarterEndDate}, Week: ${week}.5`,
      );
      fetchDataInRange(
        report,
        headers,
        results,
        quarterStartDate,
        quarterEndDate,
        "Quarter",
        week + 0.5,
        service,
        realmId,
      );
      Utilities.sleep(150);
    }
    // if end of year, get full year data and reset week.
    if (isYearEnd) {
      const yearStartDate = getYearStartDate(startDate);
      week++;
      fetchDataInRange(
        report,
        headers,
        results,
        yearStartDate,
        endDate,
        "Year",
        week,
        service,
        realmId,
      );
      Utilities.sleep(150);
      currYear++;
      [today, startDate, endDate, week] = initializeDates(currYear);
    } else {
      [startDate, endDate] = iterateDates(endDate);
    }
  }
  sheet.clear();
  addToSheet(sheet, headers, results);
}

function getUpcomingSaturday(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = (6 - day + 7) % 7;
  result.setDate(result.getDate() + daysUntilSaturday);
  return result;
}

const fetchDataInRange = (
  report,
  headers,
  results,
  startDate,
  endDate,
  period,
  week,
  service,
  realmId,
) => {
  const url =
    QUICKBOOKS_URL +
    realmId +
    report.uriPath +
    report.queryString(startDate, endDate);
  let data;
  try {
    data = quickbooksFetch(url, service);
  } catch (err) {
    const subject = "Quickbooks Integration API Error";
    emailAlert(subject, err.message);
    return;
  }

  const allItems = [];
  recursiveDataExtract(data.Rows.Row, allItems);

  mapAndInsertItems(
    allItems,
    report.mapItems,
    headers,
    results,
    startDate,
    endDate,
    period,
    week,
  );
};
/**
 * Fetches QB Account items at query time, and inserts into Accounts sheet.
 */
function fetchAndInputAccounts(report) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  let results = [];

  sheet = qbGetOrMakeSheet(report.name, NOT_PERIODIC);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (sheet.getLastRow() - 1 > 0) {
    results = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
      .getValues();
  }
  const url =
    QUICKBOOKS_URL +
    realmId +
    report.uriPath +
    report.queryString() +
    "&include-inactive=true";
  let data;
  try {
    data = quickbooksFetch(url, service);
  } catch (err) {
    const subject = "Quickbooks Integration API Error";
    emailAlert(subject, err.message);
    return;
  }
  Logger.log(data);
  const allItems = data.QueryResponse.Account;
  mapAndInsertItems(allItems, report.mapItems, headers, results, new Date());

  addToSheet(sheet, headers, results);
}

function testFetchAndInputAccounts(report) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  let results = [];

  sheet = qbGetOrMakeSheet(report.name, NOT_PERIODIC);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (sheet.getLastRow() - 1 > 0) {
    results = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
      .getValues();
  }
  const url =
    QUICKBOOKS_URL +
    realmId +
    report.uriPath +
    report.queryString() +
    "&include-inactive=true";
  let data;
  try {
    data = quickbooksFetch(url, service);
  } catch (err) {
    const subject = "Quickbooks Integration API Error";
    emailAlert(subject, err.message);
    return;
  }
  Logger.log(data);
  const allItems = data.QueryResponse.Account;
  mapAndInsertItems(allItems, report.mapItems, headers, results, new Date());

  upsertToChosenSheet_(sheet, headers, results);
}

function fetchAndInputAllBillPayments(report) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  let results = [];

  sheet = qbGetOrMakeSheet(report.name, NOT_PERIODIC);
  const headers = ["date", "name", "CAD"]; 

  let startPos = START_POSITION;
  let next = true;
  const startDate = new Date("2021-01-01");
  const endDate = getLastSunday();
  do {
    const url =
      QUICKBOOKS_URL +
      realmId +
      report.uriPath +
      report.queryString(startDate, endDate, startPos);
    let data;
    try {
      data = quickbooksFetch(url, service);
    } catch (err) {
      const subject = "Quickbooks Integration API Error";
      emailAlert(subject, err.message);
      return;
    }
    const allItems = data.QueryResponse.BillPayment;
    for (item of allItems) {
      Logger.log(item);
      results.push([
        new Date(item.MetaData.CreateTime),
        item.VendorRef.name,
        item.TotalAmt * (item.ExchangeRate || 1),
      ]);
    }
    if (allItems.length !== MAX_RESULTS) next = false;
    startPos += MAX_RESULTS;
    Utilities.sleep(150);
  } while (next);
  sheet.clear();
  addToSheet(sheet, headers, results);
}

function test() {
  getAccountsByNumPrefix("63");
}
function fetchAndInputHavocInvoices(report) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  let results = [];

  sheet = qbGetOrMakeSheet(report.name, NOT_PERIODIC);
  const headers = ["date", "name", "CAD", "Balance"]; 

  let startPos = START_POSITION;
  let next = true;
  do {
    const url =
      QUICKBOOKS_URL + realmId + report.uriPath + report.queryString();
    Logger.log(url);
    let data;
    try {
      data = quickbooksFetch(url, service);
    } catch (err) {
      const subject = "Quickbooks Integration API Error";
      emailAlert(subject, err.message);
      return;
    }
    Logger.log(data);
    const allItems = data.QueryResponse.Invoice;
    for (item of allItems) {
      Logger.log(item);
      results.push([
        new Date(item.TxnDate),
        item.CustomerRef.name,
        item.TotalAmt * (item.ExchangeRate || 1),
        item.Balance * (item.ExchangeRate || 1),
      ]);
    }
    if (allItems.length !== MAX_RESULTS) next = false;
    startPos += MAX_RESULTS;
    Utilities.sleep(150);
  } while (next);
  sheet.clear();
  addToSheet(sheet, headers, results);
}

function getAccountsByNumPrefix(prefix) {
  const service = getQuickbooksService();
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  let startPos = START_POSITION;
  let results = [];
  let next = true;
  do {
    const url =
      QUICKBOOKS_URL +
      realmId +
      "/query?query=" +
      encodeURIComponent(
        "select Id, Name, AcctNum from Account startPosition " +
          startPos +
          " MAXRESULTS " +
          MAX_RESULTS,
      );
    let data;
    try {
      data = quickbooksFetch(url, service);
    } catch (err) {
      Logger.log(err);
      return;
    }
    const accounts = data.QueryResponse.Account;
    results.push(...accounts);
    if (accounts.length !== MAX_RESULTS) next = false;
    startPos += MAX_RESULTS;
    Utilities.sleep(150);
  } while (next);
  const filtered = results.filter(
    (acct) =>
      acct.AcctNum &&
      acct.AcctNum.length === 5 &&
      acct.AcctNum.indexOf(prefix) === 0,
  );
  Logger.log(filtered);
  const acctIds = filtered.map((x) => x.Id);
  return acctIds;
}
const BUDGET_ACCOUNTS = ["60", "61", "62", "63", "64"];

function getAcctDetailsById() {
  const service = getQuickbooksService();
  const startDate = new Date("2021-01-01");
  const endDate = getLastSunday();
  const headers = [
    "Account Name",
    "Date",
    "Transaction Type",
    "Number",
    "Name",
    "Class",
    "Memo",
    "Split",
    "Amount",
    "Balance",
  ];
  const results = [];
  if (!testService(service)) return;
  const realmId =
    PropertiesService.getScriptProperties().getProperty("QBO_REALM_ID");
  const accts = [];
  for (const acctPrefix of BUDGET_ACCOUNTS) {
    const acctIds = getAccountsByNumPrefix(acctPrefix);
    Logger.log(acctIds);
    accts.push(...acctIds);
  }
  Logger.log("List of acct IDs: " + accts);
  for (const acct of accts) {
    Logger.log(acct);
    const url =
      QUICKBOOKS_URL +
      realmId +
      "/reports/ProfitAndLossDetail" +
      reportsQueryString(startDate, endDate) +
      "&account=" +
      acct;
    Logger.log(url);
    let data = quickbooksFetch(url, service);
    Logger.log(data);
    if (Object.keys(data.Rows).length > 0) {
      const acctName =
        data.Rows.Row[0].Rows.Row[0].Rows.Row[0].Header.ColData[0].value;
      const transactions = data.Rows.Row[0].Rows.Row[0].Rows.Row[0].Rows.Row;
      // updated endpoint
      // const acctName =
      // data.Rows.Row[3].Rows.Row[0].Header.ColData[0].value;
      for (const transaction of transactions) {
        const transactionDetails = transaction.ColData.map((x) => x.value);
        transactionDetails[0] = new Date(transactionDetails[0]);
        results.push([acctName, ...transactionDetails]);
      }
    }
    Logger.log(results);
    Utilities.sleep(150);
  }
  sheet = qbGetOrMakeSheet("Budgets", NOT_PERIODIC);
  sheet.clear();
  addToSheet(sheet, headers, results);
}
