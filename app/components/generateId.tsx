import { NextRequest, NextResponse } from 'next/server';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  prompt: string;
}

interface ChatSuccessResponse {
  message: ChatMessage;
}

interface ChatErrorResponse {
  error: string;
}

// Safe ID generator for environments without crypto.randomUUID
const generateId = (): string => {
  if (typeof globalThis !== 'undefined' && 'crypto' in globalThis) {
    const cryptoObj = globalThis.crypto as Crypto;
    if ('randomUUID' in cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }
  }

  const randomPart = Math.random().toString(16).slice(2);
  const timePart = Date.now().toString(16);
  return `${timePart}-${randomPart}`;
};

export async function POST(
  req: NextRequest
): Promise<NextResponse<ChatSuccessResponse | ChatErrorResponse>> {
  try {
    const body = (await req.json()) as Partial<ChatRequestBody>;

    if (typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim();
    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    const charCount = prompt.length;

    const replyContent = `You said: "${prompt}"

Here is a simple analysis of your message:
- Approximate word count: ${wordCount}
- Character count (including spaces): ${charCount}

This is mini, a mock AI assistant. Replace the logic in /app/api/chat/route.ts with a real LLM API call (OpenAI, Gemini, etc.) to get smarter responses.`;

    const responseMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { message: responseMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}