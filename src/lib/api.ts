import type { AIResponse, Conversation, Message, SearchMode, Source } from "@/types";

function apiBase(): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length > 0 && segments[segments.length - 1].includes(".")) segments.pop();
  const appIndex = segments.lastIndexOf("app");
  const contextPath = appIndex >= 0 ? segments.slice(0, appIndex) : segments.slice(0, 1);
  return `/${contextPath.join("/")}/api`.replace(/^\/\/api$/, "/api");
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error("Could not reach the Seekora API. Check the API deployment and connection.");
  }

  let payload: unknown;
  let responseText = "";
  try {
    responseText = await response.text();
    if (!responseText.trim()) {
      console.warn("Seekora API returned an empty response", { path, status: response.status });
      throw new Error(`Seekora returned an empty response (${response.status}).`);
    }
    payload = JSON.parse(responseText) as unknown;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Seekora returned an empty response")) throw err;
    console.warn("Seekora API returned non-JSON content", {
      path,
      status: response.status,
      contentType: response.headers.get("content-type") || "missing",
    });
    throw new Error(`Seekora returned an invalid response (${response.status}).`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    console.warn("Seekora API returned an unexpected JSON shape", {
      path, status: response.status, type: Array.isArray(payload) ? "array" : typeof payload,
    });
    throw new Error(`Seekora returned an unexpected response (${response.status}).`);
  }

  const record = payload as Record<string, unknown>;
  if (record.success === true && "data" in record) {
    if (!response.ok) {
      throw new Error(typeof record.message === "string" ? record.message : `Request failed (${response.status}).`);
    }
    return record.data as T;
  }
  if (!response.ok || record.success === false) {
    throw new Error(typeof record.message === "string" && record.message.trim()
      ? record.message
      : `Request failed (${response.status}).`);
  }

  // Some deployed API revisions return the AI object without the common envelope.
  if (path === "/ai" && typeof record.answer === "string") return record as T;

  console.warn("Seekora API returned an unrecognized successful JSON shape", {
    path,
    status: response.status,
    contentType: response.headers.get("content-type") || "missing",
    fields: Object.keys(record),
  });
  throw new Error(`Seekora returned an unexpected response (${response.status}).`);
}

interface SendMessageParams {
  query: string;
  mode: SearchMode;
  imageData?: string;
  conversationId?: string;
  history?: { role: string; content: string }[];
  save?: boolean;
}

interface AiApiResponse {
  answer: string;
  sources?: Source[];
  conversationId: string | null;
}

export async function sendToAI(params: SendMessageParams): Promise<AIResponse> {
  const response = await apiRequest<AiApiResponse>("/ai", {
    method: "POST",
    body: { ...params, save: params.save ?? true },
  });
  if (!response || typeof response.answer !== "string" || !response.answer.trim()) {
    throw new Error("Seekora did not return an answer. Please try again.");
  }
  const sources = Array.isArray(response.sources)
    ? response.sources.filter((source): source is Source =>
      !!source && typeof source === "object"
      && typeof source.title === "string" && typeof source.url === "string")
    : [];
  return {
    answer: response.answer,
    sources,
    conversationId: typeof response.conversationId === "string" ? response.conversationId : "",
  };
}

export function getConversations(): Promise<Conversation[]> {
  return apiRequest<Conversation[]>("/conversations");
}

export function getConversationMessages(conversationId: string): Promise<Message[]> {
  return apiRequest<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
}

export function deleteConversation(conversationId: string): Promise<void> {
  return apiRequest<void>(`/conversations/${encodeURIComponent(conversationId)}`, { method: "DELETE" });
}

export async function subscribeNewsletter(email: string): Promise<string> {
  const result = await apiRequest<unknown>("/newsletter", {
    method: "POST",
    body: { email },
  });
  return typeof result === "string" ? result : "Thanks for subscribing!";
}

export async function saveContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const result = await apiRequest<unknown>("/contact", { method: "POST", body: data });
  return typeof result === "string" ? result : "Your message has been saved.";
}

export async function saveSubscription(planCode: string, billingCycle: string): Promise<string> {
  const result = await apiRequest<unknown>("/subscriptions", {
    method: "POST",
    body: { planCode, billingCycle },
  });
  return typeof result === "string" ? result : "Your plan selection has been saved.";
}
