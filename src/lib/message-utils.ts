export function extractCodeBlock(text: string): string {
  if (!text.includes("```")) {
    return text;
  }

  const lines = text.split("\n");
  let inside = false;
  const out: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inside) {
        inside = true;
        continue;
      }
      break;
    }
    if (inside) {
      out.push(line);
    }
  }

  return out.join("\n");
}

export function trimCommitMessage(message: string): string {
  const lines = message.split("\n");
  let start = 0;
  while (start < lines.length && lines[start]?.trim() === "") start++;
  let end = lines.length;
  while (end > start && lines[end - 1]?.trim() === "") end--;
  return lines.slice(start, end).join("\n");
}
