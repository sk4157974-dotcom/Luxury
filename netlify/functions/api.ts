import { handler as ttsHandler } from './tts';
import { handler as chatHandler } from './chat';

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler = async (event: any, context?: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const path = event.path || '';
  if (path.includes('tts') || path.includes('voice')) {
    return ttsHandler(event, context);
  }

  if (path.includes('chat') || path.includes('assistant')) {
    return chatHandler(event, context);
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ status: 'ok', service: 'Luxury Hotel AI API' }),
  };
};

export default async function (req: any, context?: any) {
  return handler(req, context);
}
