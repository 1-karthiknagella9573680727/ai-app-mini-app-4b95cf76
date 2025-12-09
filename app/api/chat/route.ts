import { NextRequest, NextResponse } from 'next/server';
import generateId from '@/app/components/generateId';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface ChatRequestBody {
  provider: 'openai' | 'gemini';
  messages: ChatMessage[];
}

interface ChatSuccessResponse {
  message: ChatMessage;
}

interface ChatErrorResponse {
  error: string;
}

const OPENAI_MODEL = 'gpt-4o-mini';
const GEMINI_MODEL = 'gemini-1.5-flash';

const getOpenAIClient = (): OpenAI | null => {
  const apiKey: string | undefined = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
};

const getGeminiClient = (): GoogleGenerativeAI | null => {
  const apiKey: string | undefined = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<ChatSuccessResponse | ChatErrorResponse>> {
  try {
    const body = (await req.json()) as Partial<ChatRequestBody>;

    if (!body.provider || (body.provider !== 'openai' && body.provider !== 'gemini')) {
      return NextResponse.json(
        { error: 'Invalid provider, must be "openai" or "gemini"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = body.messages;

    const latestUser = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (!latestUser) {
      return NextResponse.json(
        { error: 'At least one user message is required' },
        { status: 400 }
      );
    }

    const systemPrompt =
      'You are mini, a helpful AI assistant. Be concise, clear, and friendly.';

    if (body.provider === 'openai') {
      const client = getOpenAIClient();
      if (!client) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY is not configured on the server' },
          { status: 500 }
        );
      }

      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ];

      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 512,
      });

      const content =
        completion.choices[0]?.message?.content ?? 'I could not generate a response.';

      const responseMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(
        { message: responseMessage },
        { status: 200 }
      );
    }

    if (body.provider === 'gemini') {
      const client = getGeminiClient();
      if (!client) {
        return NextResponse.json(
          { error: 'GOOGLE_API_KEY is not configured on the server' },
          { status: 500 }
        );
      }

      const model = client.getGenerativeModel({ model: GEMINI_MODEL });

      const textParts = [
        { text: systemPrompt },
        ...messages.map((m) => ({
          text: `${m.role.toUpperCase()}: ${m.content}`,
        })),
      ];

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: textParts,
          },
        ],
      });

      const responseText =
        result.response.text() ?? 'I could not generate a response.';

      const responseMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(
        { message: responseMessage },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Unsupported provider' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}