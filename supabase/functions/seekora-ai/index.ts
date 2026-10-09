import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Source {
  title: string;
  url: string;
}

type Mode = "ask" | "research" | "analyze_url" | "analyze_image" | "chat";

interface MessagePayload {
  query: string;
  mode: Mode;
  imageData?: string;
  conversationId?: string;
  history?: { role: string; content: string }[];
  save?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: MessagePayload = await req.json();
    const { query, mode, imageData, conversationId, history, save } = body;

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let answer = "";
    let sources: Source[] = [];
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (mode === "analyze_url") {
      const result = await analyzeUrl(query, geminiKey);
      answer = result.answer;
      sources = result.sources;
    } else if (mode === "analyze_image") {
      const result = await analyzeImage(query, imageData || "", geminiKey);
      answer = result.answer;
      sources = result.sources;
    } else if (mode === "research") {
      const result = await researchMode(query, history || [], geminiKey);
      answer = result.answer;
      sources = result.sources;
    } else if (mode === "chat") {
      const result = await chatMode(query, history || [], geminiKey);
      answer = result.answer;
      sources = result.sources;
    } else {
      const result = await askMode(query, history || [], geminiKey);
      answer = result.answer;
      sources = result.sources;
    }

    let convId = conversationId || null;

    if (save === true) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing authorization header" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: query.slice(0, 60) })
          .select("id")
          .maybeSingle();

        if (conv) convId = conv.id;
      } else {
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }

      if (convId) {
        await supabase.from("messages").insert([
          { conversation_id: convId, user_id: user.id, role: "user", content: query, mode },
          { conversation_id: convId, user_id: user.id, role: "assistant", content: answer, sources: JSON.stringify(sources), mode },
        ]);
      }
    }

    return new Response(JSON.stringify({
      answer,
      sources,
      conversationId: convId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callGeminiText(prompt: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    return "I'm currently unable to process your request because the AI service is not configured. Please contact the administrator to set up the AI API key. In the meantime, you can still browse your saved conversations.";
  }

  const model = "gemini-2.0-flash";
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    },
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI service error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "No response generated.";
}

async function callGeminiVision(prompt: string, base64Image: string, apiKey?: string): Promise<string> {
  if (!apiKey) {
    return "Image analysis is currently unavailable because the AI service is not configured. Please contact the administrator to set up the AI API key.";
  }

  const model = "gemini-2.0-flash";
  const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/png", data: base64Data } }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    },
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI service error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "No response generated.";
}

async function askMode(query: string, history: { role: string; content: string }[], apiKey?: string): Promise<{ answer: string; sources: Source[] }> {
  const historyContext = history.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
  const prompt = `You are Seekora AI, an intelligent information assistant. Provide clear, well-structured answers with headings, bullet points, and examples where appropriate. If you reference factual information, include the source URLs you're drawing from.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""}User question: ${query}

Format your answer with markdown. Use ## for headings, - for bullet points, and provide examples where helpful. If you cite sources, list them as markdown links [title](url).`;
  const answer = await callGeminiText(prompt, apiKey);
  return { answer, sources: extractSources(answer) };
}

async function researchMode(query: string, history: { role: string; content: string }[], apiKey?: string): Promise<{ answer: string; sources: Source[] }> {
  const historyContext = history.slice(-6).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
  const prompt = `You are Seekora AI Research Mode. Provide thoroughly researched answers with real, verifiable source links. Always include sources for factual claims.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""}Research question: ${query}

Provide a comprehensive answer structured as:
## Summary
A concise overview (2-3 sentences)

## Key Findings
Detailed findings with bullet points

## Sources
List real source links as markdown: - [Title](URL)

Only include URLs you are confident are real and relevant.`;
  const answer = await callGeminiText(prompt, apiKey);
  return { answer, sources: extractSources(answer) };
}

async function chatMode(query: string, history: { role: string; content: string }[], apiKey?: string): Promise<{ answer: string; sources: Source[] }> {
  const historyContext = history.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
  const prompt = `You are Seekora AI, a friendly and helpful assistant on the Seekora landing page chat widget. Keep answers concise (1-4 sentences) since this is a small chat box. Be conversational and helpful.

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""}User: ${query}`;
  const answer = await callGeminiText(prompt, apiKey);
  return { answer, sources: extractSources(answer) };
}

async function analyzeUrl(url: string, apiKey?: string): Promise<{ answer: string; sources: Source[] }> {
  let pageContent = "";
  let pageTitle = url;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "SeekoraAI/1.0" }, signal: AbortSignal.timeout(10000) });
    if (resp.ok) {
      const html = await resp.text();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
    }
  } catch {
    pageContent = "Unable to fetch the webpage content directly.";
  }

  const prompt = `You are Seekora AI, analyzing a webpage. Here is the content extracted from ${url}:

Title: ${pageTitle}
Content: ${pageContent}

Provide a structured summary as:
## Page Summary
A concise overview

## Key Points
3-5 bullet points

## Details
Additional relevant details

## Takeaway
A brief conclusion`;
  const answer = await callGeminiText(prompt, apiKey);
  return { answer, sources: [{ title: pageTitle, url }] };
}

async function analyzeImage(query: string, imageData: string, apiKey?: string): Promise<{ answer: string; sources: Source[] }> {
  const prompt = `You are Seekora AI, analyzing an image. The user asks: ${query || "Please describe and analyze this image in detail."}

Provide your analysis as:
## Image Description
What the image shows

## Key Observations
Notable details

## Analysis
Deeper interpretation`;
  const answer = await callGeminiVision(prompt, imageData, apiKey);
  return { answer, sources: [] };
}

function extractSources(text: string): Source[] {
  const sources: Source[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    sources.push({ title: match[1], url: match[2] });
  }
  const bareUrlRegex = /(?<!\()(https?:\/\/[^\s)]+)/g;
  while ((match = bareUrlRegex.exec(text)) !== null) {
    if (!sources.some((s) => s.url === match[1])) {
      sources.push({ title: match[1], url: match[1] });
    }
  }
  return sources;
}
