export type SearchMode = "ask" | "research" | "analyze_url" | "analyze_image" | "chat";

export interface Source {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  mode: SearchMode;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  answer: string;
  sources: Source[];
  conversationId: string;
}

export interface ChatMessage {
  role: "user" | "bot";
  content: string;
  sources?: Source[];
}
