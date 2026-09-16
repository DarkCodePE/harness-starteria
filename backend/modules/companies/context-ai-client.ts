import { callAiService } from '../ai/bridge.service';

export interface ContextAiInput {
  sourceType: 'WEBSITE' | 'LINKEDIN' | 'FILE';
  title?: string | null;
  url?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  cleanContent: string;
  requestId?: string;
  userId: string;
  role: string;
}

export interface ContextAiFileInput {
  sourceType: 'FILE';
  mimeType: string;
  fileName: string;
  fileBase64: string;
  requestId?: string;
  userId: string;
  role: string;
}

export interface ContextAiResult {
  entries: Array<{
    dimension: string;
    fieldKey: string;
    value: unknown;
    confidence: number;
    verificationStatus: 'UNVERIFIED' | 'INFERRED' | 'NEEDS_REVIEW';
  }>;
  summary: string;
  missing: string[];
  warnings: string[];
  tokensUsed?: number;
  model?: string;
  estimatedCost?: number;
}

export class ContextAiClient {
  async extract(input: ContextAiInput): Promise<ContextAiResult> {
    const result = await callAiService('POST', '/api/v1/ai/context-extract', {
      sourceType: input.sourceType,
      title: input.title,
      url: input.url,
      mimeType: input.mimeType,
      fileName: input.fileName,
      cleanContent: input.cleanContent,
    }, {
      requestId: input.requestId,
      userClaims: { userId: input.userId, role: input.role },
      costCapUsd: '0.0500',
      timeoutMs: 45_000,
      maxRetries: 1,
    });
    return result as ContextAiResult;
  }

  async extractFile(input: ContextAiFileInput): Promise<ContextAiResult & { cleanContent?: string; rawContent?: string }> {
    const result = await callAiService('POST', '/api/v1/ai/context-extract-file', {
      sourceType: input.sourceType,
      mimeType: input.mimeType,
      fileName: input.fileName,
      fileBase64: input.fileBase64,
    }, {
      requestId: input.requestId,
      userClaims: { userId: input.userId, role: input.role },
      costCapUsd: '0.0500',
      timeoutMs: 60_000,
      maxRetries: 1,
    });
    return result as ContextAiResult & { cleanContent?: string; rawContent?: string };
  }
}
