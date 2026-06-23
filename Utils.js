/**------------------------------- ALERT UTILS -------------------------------**/
/**
 * Sends an email with given subject and body to email in ALERT_RECIPIENT PROPERTY
 */
const emailAlert = (subject, body) => {
  const recipient =
    PropertiesService.getScriptProperties().getProperty("ALERT_RECIPIENT");
  MailApp.sendEmail(recipient, subject, body);
};

/**------------------------------- QUICKBOOKS API UTILS -------------------------------**/
/**
 * Formats and returns a Quickbooks standard reports query string with the date range.
 */
function reportsQueryString(startDate, endDate) {
  const startDateStr = Utilities.formatDate(
    startDate,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
  const endDateStr = Utilities.formatDate(
    endDate,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
  return `?accounting_method=Accrual&start_date=${startDateStr}&end_date=${endDateStr}`;
}
/**
 * Returns the URI query string for Quickbooks accounts query.
 */
function accountsQueryString() {
  const query = encodeURIComponent(
    "SELECT * FROM Account MAXRESULTS " + MAX_RESULTS,
  );
  return `/query?query=${query}`;
}
function havocInvoiceQueryString() {
  const query = encodeURIComponent(
    "SELECT * FROM Invoice WHERE CustomerRef = '1940' MAXRESULTS " +
      MAX_RESULTS,
  );
  return `/query?query=${query}`;
}
// function havocInvoiceQueryString() {
//   const query = encodeURIComponent("SELECT * FROM Invoice MAXRESULTS " + MAX_RESULTS);
//   return `/query?query=${query}`;
// }
function transactionDetailQueryString() {
  const query = encodeURIComponent("SELECT * FROM ");
}
/**
 * Returns the URI query string for Quickbooks billPayments query.
 */
function billPaymentsQueryString(startStr, endStr, startPos = 1) {
  const query = encodeURIComponent(
    "SELECT * FROM BillPayment WHERE TxnDate >= '" +
      startStr.toISOString().split("T")[0] +
      "' AND TxnDate < '" +
      endStr.toISOString().split("T")[0] +
      "' ORDERBY TxnDate ASC startPosition " +
      startPos +
      " MAXRESULTS " +
      MAX_RESULTS,
  );
  return `/query?query=${query}`;
}
/**
 * Fetches quickbooks API with the given url, throws error if error codes 400+ return.
 */
const quickbooksFetch = (url, service) => {
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + service.getAccessToken(),
      Accept: "application/json",
      "Content-Type": "application/text", // Required for query endpoint
    },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() >= 400) {
    const intuitTid = response.getHeaders()["intuit_tid"] || "Unavailable";
    const errorDetails = response.getContentText();
    const error = { message: `Error id: ${intuitTid}. ${errorDetails}` };
    Logger.log(error);
    throw error;
  }
  Utilities.sleep(120);
  return JSON.parse(response.getContentText());
};
/**------------------------------- SPREADSHEET UTILS -------------------------------**/
const UPDATE_DATE_SHEET = Object.freeze({
  name: "Update Date",
  header: "Date Last Updated",
  results: "",
});
const updateLastUpdatedDate = () => {
  const updateDateSheet = qbGetOrMakeSheet(UPDATE_DATE_SHEET.name, false);
  updateDateSheet.getRange(1, 2).setValue(new Date().toString());
};
const updateAccountsUpdatedDate = () => {
  const updateDateSheet = qbGetOrMakeSheet(UPDATE_DATE_SHEET.name, false);
  updateDateSheet.getRange(2, 2).setValue(new Date().toString());
};

const updateFridayReportDate = () => {
  const updateDateSheet = qbGetOrMakeSheet(UPDATE_DATE_SHEET.name, false);
  updateDateSheet.getRange(2, 2).setValue(new Date());
};
/**
 * Gets a sheet of the given name, or makes and configures one if missing.
 */
const qbGetOrMakeSheet = (sheetName, isPeriodic) => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("→ Requested sheet name: " + sheetName);
  let sheet = spreadsheet.getSheetByName(sheetName);
  Logger.log("→ getSheetByName result: " + (sheet ? "FOUND" : "NOT FOUND"));
  if (!sheet) {
    Logger.log("→ Creating sheet...");
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log("→ Sheet created: " + sheet.getName());
    if (isPeriodic) {
      sheet
        .getRange(1, 1, 1, DATE_BUFFER)
        .setValues([
          ["Week Start Date", "Week End Date", "Period", "Period Value"],
        ]);
    }
    sheet.getRange(1, 1).setValue("Date"); //Not used, only kept to avoid empty range errors.
  }
  return sheet;
};
/**
 * Adds the headers and results to the given sheet. Headers are added along column A.
 */
const addToSheet = (sheet, headers, results) => {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, results.length, results[0].length).setValues(results);
};

const upsertToChosenSheet_ = (sheet, headers, results) => {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const today = new Date();
  // requires dates formatted as dd/MM/YYYY
  const formattedDate = new Intl.DateTimeFormat("en-US").format(today);
  let findToday = sheet.getRange("A:A").createTextFinder(formattedDate);
  let result = findToday.findNext();
  const newRowData = results[results.length - 1];
  let numCols = results[0].length;

  // if today is already present in the spreadsheet, overwrite value
  if (result) {
    const updateIndex = result.getRow();
    numCols = newRowData.length;
    Logger.log(`update index ${updateIndex}`);
    sheet.getRange(updateIndex, 1, 1, numCols).setValues([newRowData]);
  } else {
    const nextRow = sheet.getLastRow() + 1;
    Logger.log(`Next Row ${nextRow}`);
    sheet.getRange(nextRow, 1, 1, numCols).setValues([newRowData]);
  }
};

/**------------------------------- DATA TRANSFORM UTILS -------------------------------**/
/**
 * Extracts data from Quickbooks standard report objects.
 */
const recursiveDataExtract = (rows, allItems) => {
  rows.forEach((row) => {
    if (row.Rows && row.Rows.Row) recursiveDataExtract(row.Rows.Row, allItems);
    if (row.Summary && row.Summary.ColData) allItems.push(row.Summary.ColData);
    if (row.Header && row.Header.ColData) allItems.push(row.Header.ColData);
    if (row.ColData) allItems.push(row.ColData);
  });
};
/**
 * Extracts data from Quickbooks accounts objects.
 */
const mapAccountsItem = (item) => {
  const label = item.FullyQualifiedName;
  const amount = item.CurrentBalance;
  Logger.log(label + ", " + amount);
  return [label, amount];
};

/**
 * Extracts data from Quickbooks billPayments objects.
 */
const mapBillPaymentsItem = (item) => {
  Logger.log(item);
  const label = item.VendorRef.name;
  const amount = item.TotalAmt;
  return [label, amount];
};
const mapInvoiceItem = (item) => {
  Logger.log(item);
  const label = item.VendorRef.name;
  const amount = item.TotalAmt;
  return [label, amount];
};
/**
 * Takes Quickbooks data object ([{value: <label>},{value: <amount>}]) and maps to label and amount.
 */
const mapReportsItem = (item) => {
  const label = item[0].value;
  const amount = parseFloat(item[1].value.replace(/[^0-9.-]+/g, "")) || 0;
  return [label, amount];
};

const mapSalesByCustomer = (item) => {
  Logger.log(item);
};
/**
 * Takes items, maps them using the itemMapper to label and amount, and adds them to the results array. Appends new item to headers and results if label is not in headers list.
 */
const mapAndInsertItems = (
  items,
  itemMapper,
  headers,
  results,
  startDate,
  endDate = 0,
  period = NOT_PERIODIC,
  periodVal = 0,
) => {
  // Logger.log("a");
  const newRow = [];
  if (period === NOT_PERIODIC) {
    newRow.push(...new Array(headers.length).fill(0));
    newRow[0] = startDate.toDateString();
  } else {
    newRow.push(
      startDate.toDateString(),
      endDate.toDateString(),
      period,
      periodVal,
      ...new Array(headers.length - DATE_BUFFER).fill(0),
    );
  }
  // Logger.log("b");
  // Logger.log(items);
  // if (items.length > 0){
  // Logger.log(items);
  for (const item of items) {
    if (item.length > 1 || item?.FullyQualifiedName) {
      // Logger.log("d");
      const [label, amount] = itemMapper(item);
      if (!headers.includes(label)) {
        // Logger.log("e");
        headers.push(label);
        results.forEach((result) => result.push(0));
        newRow.push(0);
      }
      newRow[headers.indexOf(label)] = amount;
    }
  }
  // Logger.log("f");
  // Logger.log("header: " + headers.length);
  // Logger.log("new row: " + newRow.length);
  results.push(newRow);
};

function escapeAmpersands(html) {
  return html.replace(
    /&(?!(amp;|lt;|gt;|quot;|apos;|#[0-9]+;|#x[0-9A-Fa-f]+;))/g,
    "&amp;",
  );
}

/**
 * Turns HTML text string into a text string.
 */
function htmlToText(html) {
  if (!html) return "";

  return (
    html
      // Remove script/style blocks
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")

      // Replace common structural tags with line breaks
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(
        /<\/?(p|div|li|tr|table|section|article|header|footer)[^>]*>/gi,
        "\n",
      )

      // Remove all remaining tags
      .replace(/<[^>]+>/g, "")

      // Decode a few common HTML entities
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")

      // Clean up whitespace and newlines
      .replace(/\r\n|\r/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim()
  );
}

/**------------------------------- DATE UTILS -------------------------------**/
/**
 * Takes the first day of the year, and returns the date of the first saturday of the year
 */
const getFirstSaturday = (yearStart) => {
  const yearStartDay = yearStart.getDay();
  const offset = DAYS_IN_WEEK - yearStartDay;
  return new Date(yearStart.setDate(offset));
};
/**
 * gets today's date, the first day of the year, and the first saturday of the year.
 */
const initializeDates = (year) => {
  const today = new Date();
  // const yearStart = new Date(today.getFullYear() - YEARS_TO_FETCH, 0, 1);
  const yearStart = new Date(year, 0, 1);
  let startDate = new Date(yearStart);
  let endDate = getFirstSaturday(yearStart);
  return [today, startDate, endDate, WEEK_START];
};
const iterateDates = (endDate) => {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() + 1);
  endDate.setDate(endDate.getDate() + DAYS_IN_WEEK);
  return [startDate, endDate];

  // const newStartDate = new Date(endDate);
  // newStartDate.setDate(newStartDate.getDate() + 1)
};
const getYearStartDate = (year) => new Date(year.getFullYear(), 0, 1);
const getYearEndDate = (year) => new Date(year.getFullYear(), 11, 31);

function getLastSunday(date = new Date()) {
  const day = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const diff = day === 0 ? 7 : day; // if today is Sunday, go back 7 days
  const lastSun = new Date(date);
  lastSun.setDate(date.getDate() - diff);
  lastSun.setHours(0, 0, 0, 0); // normalize to midnight
  Logger.log(lastSun);
  return lastSun;
}
