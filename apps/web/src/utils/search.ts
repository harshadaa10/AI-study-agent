import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateEmbedding } from './embeddings'

export type SearchResult = {
  note_id:    string
  content:    string
  similarity: number
}

// Finds the 5 most semantically similar notes to a query string
export async function semanticSearch(
  query:   string,
  userId:  string,
  limit:   number = 5
): Promise<SearchResult[]> {

  console.log(`[Search] Generating embedding for query: "${query}"`)

  // 1. Convert the search query into an embedding
  const queryEmbedding = await generateEmbedding(query)
  console.log(`[Search] Embedding generated — ${queryEmbedding.length} dimensions`)


  const { data, error } = await supabaseAdmin.rpc('match_notes', {
    query_embedding: queryEmbedding,
    match_user_id:   userId,
    match_count:     limit,
  })

  if (error) {
    console.error('[Search] Supabase RPC error:', error)
    throw new Error(`Semantic search failed: ${error.message}`)
  }

  console.log(`[Search] Found ${data?.length ?? 0} results`)
  return data as SearchResult[]
}