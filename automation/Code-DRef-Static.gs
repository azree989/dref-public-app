/** STATIC-FORMULARY-0.9 | 12 October 2026 | corrected nested-frame delivery. */
const FORMULARY_SHEET_ID = '1fAsbBG43d7sg376Lv5KIjWychJTqYdHLDsy_8DyllqU';
const DREF_PWA_ORIGINS = ['https://dref-app.purplecrow65.chatgpt.site','https://dref.redlandguy87.workers.dev','https://dref-my.pages.dev'];

function doGet(e) {
  const params = (e && e.parameter) || {};
  // Public, read-only medicine catalogue. No arbitrary Sheet/range parameters.
  if (params.format === 'dref-json') {
    const payload = getPwaFormularyData();
    payload.sourceId = FORMULARY_SHEET_ID;
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (params.pwaBridge === '1') {
    if (!DREF_PWA_ORIGINS.includes(params.parentOrigin) || !/^[a-f0-9]{48}$/.test(params.requestId || '')) {
      return HtmlService.createHtmlOutput('Invalid DRef connection request.');
    }
    const parentOrigin = JSON.stringify(params.parentOrigin);
    const requestId = JSON.stringify(params.requestId);
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>' +
      'const expectedOrigin=' + parentOrigin + ';const requestId=' + requestId + ';' +
      // Google inserts sandboxFrame and userHtmlFrame. Target the allowed origin
      // through each ancestor rather than assuming a fixed number of frames.
      'function deliver(message){let target=window;for(let depth=0;depth<8;depth++){const next=target.parent;if(next===target)break;target=next;target.postMessage(message,expectedOrigin);}}' +
      'deliver({type:"DREF_FORMULARY_READY",requestId:requestId});' +
      'google.script.run.withSuccessHandler(function(payload){deliver({type:"DREF_FORMULARY_RESPONSE",requestId:requestId,ok:true,payload:payload});})' +
      '.withFailureHandler(function(){deliver({type:"DREF_FORMULARY_RESPONSE",requestId:requestId,ok:false});})' +
      '.getPwaFormularyData();' +
      '</script></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('DRef Formulary Connection')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('PKD Bachok Formulary')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getFormularyData() {
  const ss = SpreadsheetApp.openById(FORMULARY_SHEET_ID);
  const sheet = ss.getSheetByName('Sheet1');
  const values = sheet.getDataRange().getValues();
  values.shift();
  return values.map(row => ({
    genericName: row[0], brandName: row[1], dosage: row[2], indications: row[3],
    prescriberCategory: row[4], pictureUrl: row[5], lasaGeneric: row[6],
    tallManGeneric: row[7], lasaBrand: row[8]
  }));
}

function getNotice() {
  const sheet = SpreadsheetApp.openById(FORMULARY_SHEET_ID).getSheetByName('Sheet1');
  return sheet.getRange('J2').getValue() || 'Default tooltip message';
}

/** Fixed source, read only. Fields A:I and the notice in J2 only. */
function getPwaFormularyData() {
  const sheet = SpreadsheetApp.openById(FORMULARY_SHEET_ID).getSheetByName('Sheet1');
  if (!sheet) throw new Error('Formulary sheet was not found.');
  const lastRow = Math.max(2, sheet.getLastRow());
  const values = sheet.getRange(1, 1, lastRow, 10).getDisplayValues();
  const names = ['genericName','brandName','dosage','indications','prescriberCategory','pictureUrl','lasaGeneric','tallManGeneric','lasaBrand'];
  const records = values.slice(1).filter(row => String(row[0] || '').trim()).map(row => {
    const item = {};
    names.forEach((name, index) => { item[name] = String(row[index] || ''); });
    return item;
  });
  return {schemaVersion: 1, records: records, notice: String(values[1][9] || ''), fetchedAt: new Date().toISOString()};
}
