type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  model = "meta-llama/llama-3-8b-instruct"
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as ChatCompletionResponse;

  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}