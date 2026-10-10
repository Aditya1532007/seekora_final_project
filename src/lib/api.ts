import type { AIResponse, Conversation, Message, SearchMode, Source } from "@/types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function apiBase(): string {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configuredBase) return configuredBase.replace(/\/+$/, "");

  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length > 0 && segments[segments.length - 1].includes(".")) segments.pop();
  const appIndex = segments.lastIndexOf("app");
  const contextPath = appIndex >= 0 ? segments.slice(0, appIndex) : segments.slice(0, 1);
  return `${contextPath.length ? `/${contextPath.join("/")}` : ""}/api`;
}

function getErrorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
  }
  if (status >= 500) {
    return "Seekora could not complete that search. The AI service may be unavailable; please try again shortly.";
  }
  return `Request failed (${status}).`;
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
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error("Could not reach the Seekora server. Check that Tomcat is running.");
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      throw new Error(
        response.status >= 500
          ? "Seekora could not complete that search. The AI service may be unavailable; please try again shortly."
          : `Seekora returned an invalid response (${response.status}).`,
      );
    }
  }

  if (!response.ok) {
    const message = getErrorMessage(response.status, payload);
    throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : message);
  }
  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    throw new Error(`Seekora returned an invalid response (${response.status}).`);
  }
  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) throw new Error(envelope.message || getErrorMessage(response.status, payload));
  if (envelope.success !== true || !("data" in payload)) {
    throw new Error(`Seekora returned an invalid response (${response.status}).`);
  }
  return envelope.data;
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
  return {
    answer: response.answer,
    sources: Array.isArray(response.sources) ? response.sources : [],
    conversationId: response.conversationId ?? "",
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
