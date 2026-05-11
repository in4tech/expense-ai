export type ParsedReceiptData = {
  merchant?: string | null;
  total?: number | null;
  category?: string | null;
};

export type UploadReceiptResponse = {
  id?: number;
  text?: string;
  ocr_text?: string;
  parsed_data?: ParsedReceiptData;
};
