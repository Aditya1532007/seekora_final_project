export function formatMarkdown(text: string): string {
  if (!text) return "";

  let html = text;

  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="bg-slate-800/60 rounded-lg p-4 overflow-x-auto my-3 text-sm text-slate-200"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-800/60 rounded px-1.5 py-0.5 text-sm text-cyan-300">$1</code>');

  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;
  let inNumberList = false;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const numberMatch = line.match(/^\d+\.\s+(.*)$/);

    if (headingMatch) {
      if (inList) { result.push("</ul>"); inList = false; }
      if (inNumberList) { result.push("</ol>"); inNumberList = false; }
      const level = headingMatch[1].length;
      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
      result.push(`<h${level} class="${sizes[level - 1] || "text-base"} font-semibold text-white mt-4 mb-2">${headingMatch[2]}</h${level}>`);
    } else if (bulletMatch) {
      if (inNumberList) { result.push("</ol>"); inNumberList = false; }
      if (!inList) { result.push('<ul class="list-disc list-inside space-y-1 my-2 text-slate-300">'); inList = true; }
      result.push(`<li>${bulletMatch[1]}</li>`);
    } else if (numberMatch) {
      if (inList) { result.push("</ul>"); inList = false; }
      if (!inNumberList) { result.push('<ol class="list-decimal list-inside space-y-1 my-2 text-slate-300">'); inNumberList = true; }
      result.push(`<li>${numberMatch[1]}</li>`);
    } else if (line.trim() === "") {
      if (inList) { result.push("</ul>"); inList = false; }
      if (inNumberList) { result.push("</ol>"); inNumberList = false; }
      result.push("");
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      if (inNumberList) { result.push("</ol>"); inNumberList = false; }
      result.push(`<p class="my-2 text-slate-300 leading-relaxed">${line}</p>`);
    }
  }

  if (inList) result.push("</ul>");
  if (inNumberList) result.push("</ol>");

  html = result.join("\n");

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">$1</a>',
  );

  html = html.replace(
    /(?<!["'(])\b(https?:\/\/[^\s<)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">$1</a>',
  );

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportAsText(title: string, content: string, sources: { title: string; url: string }[]): string {
  let text = `${title}\n${"=".repeat(title.length)}\n\n${content}\n`;
  if (sources.length > 0) {
    text += "\n--- Sources ---\n";
    sources.forEach((s, i) => {
      text += `${i + 1}. ${s.title} - ${s.url}\n`;
    });
  }
  return text;
}
