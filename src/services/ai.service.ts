import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AiAnalysisResult {
  isSpam: boolean;
  isToxic: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  topic: string;
  suggestedAction?: 'flag' | 'warn' | 'none';
  reason?: string;
  confidence: number;
}

export class AiService {
  static async analyzeMessage(content: string): Promise<AiAnalysisResult> {
    const apiKey = env.OPENAI_API_KEY || env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'sk-placeholder') {
      return this.fallbackHeuristicAnalysis(content);
    }

    try {
      const endpoint = env.OPENROUTER_API_KEY
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const model = env.OPENROUTER_API_KEY
        ? env.OPENROUTER_MODEL
        : env.OPENAI_MODEL;

      const prompt = `Analyze the following WhatsApp message from a community group.
Return ONLY a valid JSON object with keys:
"isSpam" (boolean), "isToxic" (boolean), "sentiment" ("positive"|"neutral"|"negative"), "topic" (string), "suggestedAction" ("flag"|"warn"|"none"), "reason" (string), "confidence" (number between 0 and 1).

Message: "${content.replace(/"/g, '\\"')}"`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        return this.fallbackHeuristicAnalysis(content);
      }

      const data: any = await response.json();
      const resultText = data.choices?.[0]?.message?.content;
      if (!resultText) return this.fallbackHeuristicAnalysis(content);

      const parsed = JSON.parse(resultText);
      return {
        isSpam: Boolean(parsed.isSpam),
        isToxic: Boolean(parsed.isToxic),
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
          ? parsed.sentiment
          : 'neutral',
        topic: parsed.topic || 'General',
        suggestedAction: parsed.suggestedAction || 'none',
        reason: parsed.reason || '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      };
    } catch (error) {
      logger.error('AI Service analysis error:', error);
      return this.fallbackHeuristicAnalysis(content);
    }
  }

  static async generateFaqResponse(question: string): Promise<string | null> {
    const apiKey = env.OPENAI_API_KEY || env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'sk-placeholder') {
      return null;
    }

    try {
      const endpoint = env.OPENROUTER_API_KEY
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const model = env.OPENROUTER_API_KEY
        ? env.OPENROUTER_MODEL
        : env.OPENAI_MODEL;

      const prompt = `You are an AI assistant for a WhatsApp community group (Limestone Hub). Answer the following member question briefly, politely, and accurately in Indonesian or English matching the user's language.

Question: "${question.replace(/"/g, '\\"')}"`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
        }),
      });

      if (!response.ok) return null;

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      logger.error('AI Service FAQ error:', error);
      return null;
    }
  }

  private static fallbackHeuristicAnalysis(content: string): AiAnalysisResult {
    const lower = content.toLowerCase();
    const spamKeywords = ['slot', 'gacor', 'pinjol', 'jackpot', 'crypto 100x', 'wa.me/'];
    const toxicKeywords = ['benci', 'tolol', 'bodoh', 'anjing', 'scam'];

    const isSpam = spamKeywords.some((kw) => lower.includes(kw));
    const isToxic = toxicKeywords.some((kw) => lower.includes(kw));

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (lower.includes('terima kasih') || lower.includes('thanks') || lower.includes('bagus')) {
      sentiment = 'positive';
    } else if (isToxic || lower.includes('kecewa') || lower.includes('parah')) {
      sentiment = 'negative';
    }

    let topic = 'General';
    if (lower.includes('harga') || lower.includes('bayar') || lower.includes('promo')) topic = 'Pricing & Sales';
    else if (lower.includes('error') || lower.includes('bug') || lower.includes('bantuan')) topic = 'Technical Support';
    else if (lower.includes('event') || lower.includes('jadwal') || lower.includes('webinar')) topic = 'Events';

    return {
      isSpam,
      isToxic,
      sentiment,
      topic,
      suggestedAction: isSpam || isToxic ? 'flag' : 'none',
      reason: isSpam ? 'Contains spam keywords' : isToxic ? 'Contains toxic keywords' : '',
      confidence: 0.9,
    };
  }
}
