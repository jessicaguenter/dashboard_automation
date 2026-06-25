const fetchAllHubspotProperties = () => {
  for (object of [CONTACTS, INVOICES, TICKETS, LINE_ITEMS, DEALS])
    fetchObjectProperties(object);
};
const fetchSpecificObjectProperties = () => {
  for (object of [INVOICES]) fetchObjectProperties(object);
};
const fetchHubspotObjects = () => {
  for (object of [CONTACTS, INVOICES, TICKETS, LINE_ITEMS, DEALS])
    fetchAllObjects(object);
  for (object of [DEAL_LINEITEM_ASSOC]) fetchAssociations(object);
};
const fetchSpecificHubspotObject = () => {
  fetchAllObjects(INVOICES);
};
const fetchSpecificHubspotAssoc = () => {
  fetchAssociations(DEAL_INVOICE_ASSOC);
};
const fetchManual = () => {
  for (object of [COMPANIES, LINE_ITEMS, DEALS]) fetchAllObjects(object);
  for (object of [COMPANY_DEAL_ASSOC, DEAL_LINEITEM_ASSOC])
    fetchAssociations(object);
};
const fetchForFriday = () => {
  for (object of [DEALS, COMPANIES, MEETINGS, CONTACTS, OWNERS])
    fetchAllObjects(object);
  Logger.log("done1");
  for (object of [
    COMPANY_DEAL_ASSOC,
    COMPANY_CONTACT_ASSOC,
    NOTE_COMPANY_ASSOC,
  ])
    fetchAssociations(object);
  Logger.log("done2");
  updateFridayReportDate();
};

// Fetches object properties for the given object. Used to get a list of properties to query for when fetching object data.
const fetchObjectProperties = (objMetadata) => {
  const propUrl = BASE_HS_URL + objMetadata.propsUrl;
  const propResponse = UrlFetchApp.fetch(propUrl, {
    method: "get",
    headers: {
      Authorization: "Bearer " + HUBSPOT_TOKEN,
    },
  });

  const propData = JSON.parse(propResponse.getContentText());
  const propertyNames = propData.results.map((p) => [p.name]); // wrap each name in its own array

  Logger.log(`🔢 Found ${propertyNames.length} properties.`);

  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      objMetadata.propsSheetName,
    ) ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(
      objMetadata.propsSheetName,
    );
  sheet.clearContents();

  // Optional header
  sheet.getRange(1, 1).setValue(objMetadata.propsHeader);

  if (propertyNames.length > 0) {
    sheet.getRange(2, 1, propertyNames.length, 1).setValues(propertyNames);
  }
};

// Hubspot connects objects with association objects. This fetches the association between objects, so that the two objects can be joined.
const fetchAssociations = (objMetadata) => {
  const limit = 100;
  let after = null;
  const allObjs = [];

  do {
    const url =
      BASE_HS_URL +
      objMetadata.apiUrl +
      `&limit=${limit}` +
      (after ? `&after=${after}` : "");

    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        Authorization: "Bearer " + HUBSPOT_TOKEN,
      },
    });

    const result = JSON.parse(response.getContentText());
    allObjs.push(...(result.results || []));
    Utilities.sleep(150);
    after = result.paging?.next?.after || null;
  } while (after);
  Logger.log(
    `Fetched ${allObjs.length} ${objMetadata.name}. ${new Date().toISOString()}`,
  );
  // Prepare rows to paste into sheet.
  const output = [objMetadata.assocProps];

  allObjs.forEach((obj) => {
    const values = objMetadata.mapper(obj, objMetadata.objName);
    if (values == null) return;
    const assocItems = obj.associations?.[objMetadata.assocItem]?.results || [];
    if (assocItems.length > 0) {
      assocItems.forEach((assocItem) => {
        output.push([...values, assocItem.id]);
      });
    }
  });
  // Write to sheet.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    ss.getSheetByName(objMetadata.querySheetName) ||
    ss.insertSheet(objMetadata.querySheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
};

const hsAssocMapper = (obj, objName) => {
  const objId = obj.id;
  const objDetail = obj.properties?.[objName] || "";
  return [objId, objDetail];
};

const noteCompanyAssocMapper = (obj, objName) => {
  if (obj.properties?.[objName] == null) return;
  const objId = obj.id;
  const objHTML = obj.properties?.[objName];
  const objBody = htmlToText(objHTML);
  const objCreatorId = obj.properties?.hubspot_owner_id;
  const objCreateDate = parseHsDate(obj.properties?.hs_createdate) || "";
  return [objId, objBody, objCreatorId, objCreateDate];
};

// Fetches all data regarding the given object.
const fetchAllObjects = (objMetadata) => {
  const limit = 100;
  let after = null;
  const allObjs = [];

  // Fetch all deals with specified properties.
  do {
    const url =
      BASE_HS_URL +
      objMetadata.apiUrl +
      `?limit=${limit}` +
      `&properties=${encodeURIComponent(objMetadata.queryProps.join(","))}` +
      `${after ? `&after=${after}` : ""}&archived=false`;

    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        Authorization: "Bearer " + HUBSPOT_TOKEN,
      },
    });

    const result = JSON.parse(response.getContentText());
    allObjs.push(...(result.results || []));
    Utilities.sleep(150);
    after = result.paging?.next?.after || null;
  } while (after);

  Logger.log(`Pulled ${allObjs.length} ${objMetadata.name}.`);

  // Format for sheet output
  const headerRow = ["id", ...objMetadata.queryProps];
  const rows = allObjs.map((obj) =>
    objMetadata.itemMapper(obj, objMetadata.queryProps),
  );
  // Dump to sheet
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      objMetadata.querySheetName,
    ) ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(
      objMetadata.querySheetName,
    );
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headerRow.length).setValues(rows);
  }
};

const parseHsDate = (hsDate) => {
  return new Date(hsDate).toLocaleString("en-US", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }); // e.g., "3/17/2021, 14:34:46"
};

const mapHsObjects = (obj, queryProps) => {
  const p = obj.properties || {};
  return [
    obj.id,
    ...queryProps.map((prop) => {
      const value = p[prop] || "";
      const isIsoTimestamp =
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value);
      if (isIsoTimestamp) {
        // Convert to readable local datetime string. Required, otherwise it fetches data in UTC time and throws off the results.
        return parseHsDate(value);
      }
      return value;
    }),
  ];
};

const mapHsOwners = (obj, queryProps) => {
  return [obj.id, obj.firstName + " " + obj.lastName, obj.userId];
};
