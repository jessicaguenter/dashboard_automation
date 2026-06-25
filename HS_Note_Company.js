// Hubspot connects objects with association objects. This fetches the association between deals and line items, so that the two objects can be joined.
const fetchNoteCompanyAssociations = () => {
  const limit = 100;
  let after = null;
  const allObjs = [];

  do {
    const url = `${BASE_HS_URL}/objects/notes?properties=hs_note_body,hubspot_owner_id&associations=companies&limit=${limit}` +
                (after ? `&after=${after}` : '');

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + HUBSPOT_TOKEN
      }
    });

    const result = JSON.parse(response.getContentText());
    allObjs.push(...(result.results || []));
    after = result.paging?.next?.after || null;
  } while (after);
  Logger.log("Pulled all data");
  // Prepare rows to paste into sheet
  const output = [["Note ID", "Note Body", "Note Create Date", "Company ID", "Note Creator ID"]];
  allObjs.forEach(note => {
    if (note.properties?.hs_note_body == null) return;
    const noteId = note.id;
    const noteHTML = note.properties?.hs_note_body;
    const noteBody = htmlToText(noteHTML);
    const noteCreatorId = note.properties?.hubspot_owner_id;
    const noteCreateDate = new Date(note.properties?.hs_createdate).toLocaleString('en-US', {
          timeZone: 'America/Vancouver',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) || "";
    const companyItems = note.associations?.['companies']?.results || [];
    if (companyItems.length > 0) {
      companyItems.forEach(item => {
        output.push([noteId, noteBody, noteCreateDate, item.id, noteCreatorId]);
      });
    }
  });
  Logger.log("Processed all data. Inserting into sheet.");
  // Write to sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("NoteCompanyMap")
              || ss.insertSheet("NoteCompanyMap");
  sheet.clearContents();
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
};