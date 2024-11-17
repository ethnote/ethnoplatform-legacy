type TextExportType = 'docx' | 'xlsx' | 'csv' | 'json' | 'txt'

export const getLinkWrapper = (type: TextExportType) => (notes: string) =>
  ({
    json: `data:text/json;chatset=utf-8,${encodeURIComponent(notes)}`,
    csv: `data:text/csv;chatset=utf-8,${encodeURIComponent(notes)}`,
    xlsx: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${notes}`,
    txt: `data:text/plain;chatset=utf-8,${encodeURIComponent(notes)}`,
    docx: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${notes}`,
  })[type]

export const makeCSVFriendly = (str: string) => {
  return `"${str.replace(/"/g, '""')}"`
}
