import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth';

@Injectable({ providedIn: 'root' })
export class ParserService {

  async parseFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const type = file.type;
    if (type === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const data = await (pdfParse as any).default(buffer);
      return data.text;
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    } else {
      return new TextDecoder().decode(buffer);
    }
  }

  private cleanLine(line: string): string {
    let cleaned = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
    cleaned = cleaned.trim();
    return cleaned;
  }

  extractPairs(text: string, preferredDelimiter?: string): [string, string][] {
    const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const pairs: [string, string][] = [];
    const delimiters = preferredDelimiter 
      ? [preferredDelimiter] 
      : ['\t', ' - ', ' – ', ',', ';', '|', ': '];

    for (const rawLine of rawLines) {
      const line = this.cleanLine(rawLine);
      if (!line) continue;
      let found = false;
      for (const delim of delimiters) {
        const parts = line.split(delim);
        if (parts.length >= 2) {
          const front = parts[0].trim();
          const back = parts.slice(1).join(delim).trim();
          if (front && back) {
            pairs.push([front, back]);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        const dashMatch = line.match(/^(.*?)\s*[–-]\s*(.*)$/);
        if (dashMatch) {
          const front = dashMatch[1].trim();
          const back = dashMatch[2].trim();
          if (front && back) {
            pairs.push([front, back]);
            found = true;
          }
        }
      }
      if (!found) {
        console.warn('Skipping line – no valid delimiter found:', line);
      }
    }
    return pairs;
  }
}