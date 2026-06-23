function testFetchAssoc() {
  fetchAssociations(NOTE_COMPANY_ASSOC);
}

const DEAL_LINEITEM_ASSOC = {
  name: "DealLineAssociations",
  apiUrl: "/objects/deals?associations=line_items",
  querySheetName: "DealLineItemMap",
  assocProps: ["Deal ID", "Deal Name", "Line Item ID"],
  objName: "dealname",
  assocItem: "line items",
  mapper: hsAssocMapper,
};

const COMPANY_DEAL_ASSOC = {
  name: "CompanyDealAssociations",
  apiUrl: "/objects/companies?associations=deals",
  querySheetName: "CompanyDealMap",
  assocProps: ["Company ID", "Company Name", "Deal ID"],
  objName: "name",
  assocItem: "deals",
  mapper: hsAssocMapper,
};

const COMPANY_CONTACT_ASSOC = {
  name: "CompanyContactAssociations",
  apiUrl: "/objects/companies?associations=contacts",
  querySheetName: "CompanyContactMap",
  assocProps: ["Company ID", "Company Name", "Contact ID"],
  objName: "name",
  assocItem: "contacts",
  mapper: hsAssocMapper,
};

const CONTACT_DEAL_ASSOC = {
  name: "ContactDealAssociations",
  apiUrl: "/objects/contacts?associations=deals",
  querySheetName: "ContactDealMap",
  assocProps: ["Contact ID", "Contact Email", "Deal ID"],
  objName: "email",
  assocItem: "deals",
  mapper: hsAssocMapper,
};

const DEAL_INVOICE_ASSOC = {
  name: "DealInvoiceAssociations",
  apiUrl: "/objects/deals?associations=invoices",
  querySheetName: "DealInvoiceMap",
  assocProps: ["Deal ID", "Deal Name", "Invoice ID"],
  objName: "name",
  assocItem: "invoices",
  mapper: hsAssocMapper,
};

const CONTACT_CONVERSATION_ASSOC = {
  name: "ContactConversationAssociations",
  apiUrl: "/objects/contacts?associations=conversations",
  querySheetName: "ContactConversationMap",
  assocProps: ["Contact ID", "Contact Email", "Conversation ID"],
  objName: "email",
  assocItem: "conversations",
  mapper: hsAssocMapper,
};

const CALL_CONTACT_ASSOC = {
  name: "CallContactAssociations",
  apiUrl:
    "/objects/calls?properties=hs_call_body,hubspot_owner_id&associations=contacts",
  querySheetName: "CallContactMap",
  assocProps: [
    "Call ID",
    "Call Body",
    "Call Creator ID",
    "Call Create Date",
    "Contact ID",
  ],
  objName: "hs_call_body",
  assocItem: "contacts",
  mapper: noteCompanyAssocMapper,
};

const NOTE_CONTACT_ASSOC = {
  name: "NoteContactAssociations",
  apiUrl:
    "/objects/notes?properties=hs_note_body,hubspot_owner_id&associations=contacts",
  querySheetName: "NoteContactMap",
  assocProps: [
    "Note ID",
    "Note Body",
    "Note Creator ID",
    "Note Create Date",
    "Contact ID",
  ],
  objName: "hs_note_body",
  assocItem: "contacts",
  mapper: noteCompanyAssocMapper,
};

// const NOTE_COMPANY_ASSOC = {
// 	name: "NoteCompanyAssociations",
// 	apiUrl: "/objects/notes?properties=hs_note_body,hubspot_owner_id&associations=companies",
// 	querySheetName: "NoteCompanyMap",
// 	assocProps: ["Note ID", "Note Body", "Note Creator ID", "Note Create Date", "Company ID"],
// 	objName: "hs_note_body",
// 	assocItem: "companies",
// 	mapper: noteCompanyAssocMapper
// }

// const DEAL_COMPANY_ASSOC = {
// 	name: "DealCompanyAssociations",
// 	apiUrl: "/objects/deals?associations=companies",
// 	querySheetName: "MapTest",
// 	assocProps: ["dea ID", "deal name", "Conversation ID"],
// 	objName: "email",
// 	assocItem: "conversations",
// }

// const CONTACT_CONVERSATION_ASSOC = {
// 	name: "ContactConversationAssociations",
// 	apiUrl: "/objects/contacts?associations=conversations",
// 	querySheetName: "CONTACT_CONVERSATION",
// 	assocProps: ["Contact ID", "Contact Email", "Conversation ID"],
// 	objName: "email",
// 	assocItem: "conversations",
// }
