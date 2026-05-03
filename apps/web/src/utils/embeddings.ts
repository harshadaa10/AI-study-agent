export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY

  if (!apiKey) {
    throw new Error('COHERE_API_KEY is not set in .env.local')
  }

  console.log('[Embeddings] Calling Cohere API...')

  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 512)

  const response = await fetch('https://api.cohere.com/v1/embed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [cleanText],
      model: 'embed-english-light-v3.0',
      input_type: 'search_document',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cohere API error: ${error}`)
  }

  const data = await response.json() as { embeddings: number[][] }

  if (!data.embeddings || !data.embeddings[0]) {
    throw new Error('Cohere returned no embeddings')
  }

  console.log(`[Embeddings] ✅ Generated ${data.embeddings[0].length}-dimension embedding`)

  return data.embeddings[0]
}

