export function parseMention(str: string): string | null {
  const match = str.match(/^<@!?(\d+)>$/) ?? str.match(/^(\d+)$/);
  return match?.[1] ?? null;
}

export function parseDuration(str: string): Date | null {
  const units: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const regex = /(\d+)([dhms])/g;
  let ms = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    ms += parseInt(match[1]!) * units[match[2]!]!;
  }
  return ms > 0 ? new Date(Date.now() + ms) : null;
}

export function formatDuration(ms: number): string {
  const parts: string[] = [];
  const units: [string, number][] = [
    ["d", 86400000],
    ["h", 3600000],
    ["m", 60000],
    ["s", 1000],
  ];
  for (const [label, value] of units) {
    const count = Math.floor(ms / value);
    if (count > 0) {
      parts.push(`${count}${label}`);
      ms %= value;
    }
  }
  return parts.length > 0 ? parts.join(" ") : "0s";
}