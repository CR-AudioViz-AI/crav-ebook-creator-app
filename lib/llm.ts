type Provider = 'openai' | 'anthropic' | 'together' | 'auto';

const provider = (process.env.LLM_PROVIDER as Provider) || 'auto';
const openaiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const togetherKey = process.env.TOGETHER_API_KEY;
const model = process.env.LLM_MODEL || 'gpt-4o-mini';

export async function llm(
  system: string | undefined,
  user: string,
  temperature = 0.7,
  maxTokens = 3000
): Promise<string> {
  if (!openaiKey && !anthropicKey && !togetherKey) {
    return `MOCK LLM OUTPUT

Your prompt: ${user.slice(0, 300)}...

This is a mock response. Add API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, or TOGETHER_API_KEY) to your .env file to enable real LLM generation.

For testing purposes, here's a structured mock response that simulates what a real LLM would generate.`;
  }

  const pickProvider = (p: Provider): 'openai' | 'anthropic' | 'together' => {
    if (p === 'auto') {
      if (openaiKey) return 'openai';
      if (anthropicKey) return 'anthropic';
      return 'together';
    }
    return p;
  };

  const activeProvider = pickProvider(provider);

  if (activeProvider === 'openai' && openaiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
      }),
    });

    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  }

  if (activeProvider === 'anthropic' && anthropicKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    const json = await response.json();
    return json?.content?.[0]?.text || '';
  }

  if (activeProvider === 'together' && togetherKey) {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${togetherKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        temperature,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: user },
        ],
      }),
    });

    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  }

  return 'No LLM provider configured';
}
