const HUBSPOT_TOKEN =
  PropertiesService.getScriptProperties().getProperty("HS_TOKEN");
const BASE_HS_URL = "https://api.hubapi.com/crm/v3";

const CONTACTS = {
  name: "Contacts",
  propsUrl: "/properties/contacts",
  apiUrl: "/objects/contacts",
  propsSheetName: "AllContactProps",
  propsHeader: "Contact Properties",
  queryProps: [
    "contact_acquisition_source",
    "createdate",
    "lead_source",
    "lifecyclestage",
    "contact_type",
    "email",
    "firstname",
    "lastname",
  ], //, 'hs_time_between_contact_creation_and_deal_close'
  querySheetName: "Contacts Raw Data",
  itemMapper: mapHsObjects,
};
const INVOICES = {
  name: "Invoices",
  propsUrl: "/properties/invoices",
  apiUrl: "/objects/invoices",
  propsSheetName: "AllInvoiceProps",
  propsHeader: "Invoice Properties",
  queryProps: [
    "hs_invoice_latest_company_name",
    "hs_invoice_status",
    "hs_amount_billed_in_company_currency",
    "hs_invoice_date",
  ],
  querySheetName: "Invoices Raw Data",
  itemMapper: mapHsObjects,
};
const TICKETS = {
  name: "Tickets",
  propsUrl: "/properties/tickets",
  apiUrl: "/objects/tickets",
  propsSheetName: "AllTicketProps",
  propsHeader: "Ticket Properties",
  queryProps: [
    "hs_pipeline_stage",
    "time_to_first_agent_reply",
    "reporting_category",
    "createdate",
    "closed_date",
    "first_agent_reply_date",
  ], // hs_pipeline_stage = Ticket status,
  querySheetName: "Tickets Raw Data",
  itemMapper: mapHsObjects,
}; // Pipelines: New: 1, In progress: 2, Paused by them: 96739990, Resolved: 4, Abandoned: 100760865, RMA Approved & Incoming: 1022989598, RMA Under Investigation: 1022989599, RMA Resolved: 1022989600

const DEALS = {
  name: "Deals",
  propsUrl: "/properties/deals",
  apiUrl: "/objects/deals",
  propsSheetName: "AllDealProps",
  propsHeader: "Deal Properties",
  queryProps: [
    "dealname",
    "amount_in_home_currency",
    "dealstage",
    "dealtype",
    "createdate",
    "hs_v2_date_entered_12109872",
    "closedate",
    "hs_v2_date_entered_12109876",
    "motor_status",
    "pipeline",
    "hs_v2_date_entered_closedwon",
    "hs_v2_date_entered_closedlost",
    "shipping_country",
    "date_delivered",
  ], // "hs_v2_date_entered_12109872" = date entered 5- project confirmed, "hs_v2_date_entered_12109876" = date entered 7 - Shipped
  querySheetName: "Deals Raw Data",
  itemMapper: mapHsObjects,
};
const LINE_ITEMS = {
  name: "Line Items",
  propsUrl: "/properties/line_items",
  apiUrl: "/objects/line_items",
  propsSheetName: "AllLineItemProps",
  propsHeader: "Line Item Properties",
  queryProps: ["name", "quantity", "amount"],
  querySheetName: "LineItem Raw Data",
  itemMapper: mapHsObjects,
};
const COMPANIES = {
  name: "Companies",
  propsUrl: "/properties/companies",
  apiUrl: "/objects/companies",
  propsSheetName: "AllCompanyProps",
  propsHeader: "Company Properties",
  queryProps: ["name", "total_revenue", "type", "country"],
  querySheetName: "Companies Raw Data",
  itemMapper: mapHsObjects,
};

const OWNERS = {
  name: "Owners",
  propsUrl: "/properties/owners",
  apiUrl: "/owners",
  propsSheetName: "AllOwnerProps",
  propsHeader: "Owner Properties",
  queryProps: ["name", "userId"],
  querySheetName: "Owners Raw Data",
  itemMapper: mapHsOwners,
};

const MEETINGS = {
  name: "Meetings",
  propsUrl: "/properties/meetings",
  apiUrl: "/objects/meetings",
  propsSheetName: "AllMeetingProps",
  propsHeader: "Meeting Properties",
  queryProps: ["hs_meeting_title", "hs_meeting_end_time"],
  querySheetName: "Meetings Raw Data",
  itemMapper: mapHsObjects,
};
