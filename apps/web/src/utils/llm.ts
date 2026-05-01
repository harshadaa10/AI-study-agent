const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3-8b-instruct'

export async function callLLM(
  prompt: string,
  systemPrompt: string
): Promise<string> {

  // Read the key INSIDE the function — not at the top of the file
  // This ensures it's always read after .env.local has been loaded
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in your .env.local file')
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt }
      ]
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${error}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('OpenRouter returned an empty response')
  }

  return text.trim()
}


export async function callLLMForJSON<T>(
  prompt: string,
  systemPrompt: string
): Promise<T> {

  const jsonSystemPrompt = systemPrompt +
    '\n\nCRITICAL: Respond with valid JSON only. No markdown, no backticks, no explanation. Just the raw JSON object.'

  const text = await callLLM(prompt, jsonSystemPrompt)

  try {
    return JSON.parse(text) as T
  } catch {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as T
  }
}