/**
 * OCR API Response Interface
 * This interface represents the response structure from OCR.space API
 */

export interface IOCRTextOverlay {
  Lines: any[]; // Can be more specific if you know the structure of Lines
  HasOverlay: boolean;
  Message: string;
}

export interface IOCRParsedResult {
  TextOverlay: IOCRTextOverlay;
  TextOrientation: string;
  FileParseExitCode: number;
  ParsedText: string;
  ErrorMessage: string;
  ErrorDetails: string;
}

export interface IOCRResponse {
  ParsedResults: IOCRParsedResult[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
  SearchablePDFURL: string;
}

/**
 * Type guard to check if OCR was successful
 */
export function isOCRSuccessful(response: IOCRResponse): boolean {
  return (
    response.OCRExitCode === 1 &&
    !response.IsErroredOnProcessing &&
    response.ParsedResults.length > 0 &&
    response.ParsedResults[0].FileParseExitCode === 1
  );
}

/**
 * Extract all parsed text from OCR response
 */
export function extractParsedText(response: IOCRResponse): string {
  return response.ParsedResults.map((result) => result.ParsedText)
    .join("\n\n")
    .trim();
}

/**
 * Type for OCR processing options
 */
export interface IOCROptions {
  apiKey?: string;
  language?: string;
  isOverlayRequired?: boolean;
  detectOrientation?: boolean;
  scale?: boolean;
  isTable?: boolean;
  OCREngine?: 1 | 2 | 3; // OCR.space supports engines 1, 2, and 3
}
