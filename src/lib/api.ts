import { supabase, EDGE_FUNCTION_URL } from "@/lib/supabase";
import type { AIResponse, SearchMode, Source } from "@/types";

interface SendMessageParams {
  query: string;
  mode: SearchMode;
  imageData?: string;
  conversationId?: string;
  history?: { role: string; content: string }[];
  save?: boolean;
}

export async function sendToAI(params: SendMessageParams): Promise<AIResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: params.query,
      mode: params.mode,
      imageData: params.imageData,
      conversationId: params.conversationId,
      history: params.history,
      save: params.save ?? true,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errBody.error || `Request failed (${resp.status})`);
  }

  const data = await resp.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    answer: data.answer,
    sources: data.sources as Source[],
    conversationId: data.conversationId,
  };
}

export async function subscribeNewsletter(email: string): Promise<string> {
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error) {
    if (error.code === "23505") return "You're already subscribed!";
    throw new Error(error.message);
  }
  return "Thanks for subscribing! We'll keep you updated.";
}

export async function saveContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<string> {
  const { error } = await supabase.from("contact_messages").insert(data);
  if (error) throw new Error(error.message);
  return "Your message has been saved. We'll get back to you soon.";
}

export async function saveSubscription(planCode: string, billingCycle: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    throw new Error("Please sign in to choose a plan.");
  }

  const { error } = await supabase.from("subscriptions").insert({
    plan_code: planCode,
    billing_cycle: billingCycle,
  });
  if (error) throw new Error(error.message);
  return `You're now on the ${planCode} plan (${billingCycle}).`;
}
