import { createCanvas, loadImage } from "@napi-rs/canvas";

import type { User } from "@fluxerjs/core";
import sharp from "sharp";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from "gifenc";

// Set FLUXER_CDN_URL in .env to override the CDN url, e.g. https://fluxer.exeli.us/media
const FLUXER_CDN = (process.env.FLUXER_CDN_URL ?? "https://fluxerusercontent.com").replace(/\/$/, "");

export function fluxerAvatarURL(userId: string, hash: string | null, size = 256): string | null {
  if (!hash) return null;
  return `${FLUXER_CDN}/avatars/${userId}/${hash}.webp?size=${size}&animated=true`;
}

export function fluxerDisplayAvatarURL(user: User, size = 256): string {
  return fluxerAvatarURL(user.id, user.avatar, size) ?? `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) % 6n)}.png`;
}

export function fluxerBannerURL(userId: string, hash: string | null, size = 1024, animated = true): string | null {
  if (!hash) return null;
  const base = `${FLUXER_CDN}/banners/${userId}/${hash}.webp?size=${size}`;
  return animated ? `${base}&animated=true` : base;
}

const cooldowns = new Map<string, number[]>();

export function canEarnXP(userId: string): boolean {
  const now = Date.now();
  const times = (cooldowns.get(userId) ?? []).filter((t) => now - t < 30_000);
  if (times.length >= 2) return false;
  cooldowns.set(userId, [...times, now]);
  return true;
}

export function xpForLevel(n: number): number {
  if (n === 0) return 0;
  return (5 * n) ** 2 + 50 * (n - 1) + 100;
}

export function xpProgress(xp: number, level: number): { current: number; required: number } {
  const floor = xpForLevel(level - 1);
  const ceil = xpForLevel(level);
  return { current: xp - floor, required: ceil - floor };
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[img] ${res.status} ${url}`);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn(`[img] fetch failed for ${url}:`, err);
    return null;
  }
}

async function extractFrames(buf: Buffer): Promise<{ frames: Buffer[]; delays: number[] } | null> {
  const meta = await sharp(buf).metadata();
  if ((meta.pages ?? 1) <= 1) return null;
  const delays = (meta.delay as number[] | undefined) ?? [];
  const frames = await Promise.all(
    Array.from({ length: meta.pages! }, (_, i) => sharp(buf, { page: i }).png().toBuffer())
  );
  return { frames, delays };
}

function encodeGIF(ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>, W: number, H: number, gif: ReturnType<typeof GIFEncoder>, delay: number) {
  const { data } = ctx.getImageData(0, 0, W, H);
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  gif.writeFrame(index, W, H, { palette, delay: Math.max(2, Math.round(delay / 10)), repeat: 0 });
}

const AVATAR_SIZE = 130;
const AVATAR_X = 30;
const AVATAR_CY = 200;

export async function generateRankCard(opts: {
  user: User;
  bannerHash: string | null;
  xp: number;
  level: number;
  rank: number;
}): Promise<{ buffer: Buffer; animated: boolean }> {
  const { user, xp, level, rank } = opts;
  const bannerUrl = fluxerBannerURL(user.id, opts.bannerHash, 1024);
  const avatarUrl = fluxerDisplayAvatarURL(user, 256);

  const [bannerBuf, avatarBuf] = await Promise.all([
    bannerUrl ? fetchImageBuffer(bannerUrl) : Promise.resolve(null),
    fetchImageBuffer(avatarUrl),
  ]);

  const [bannerFrames, avatarFrames] = await Promise.all([
    bannerBuf ? extractFrames(bannerBuf) : Promise.resolve(null),
    avatarBuf ? extractFrames(avatarBuf) : Promise.resolve(null),
  ]);

  const W = 1250;
  const H = 400;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Pre-load static avatar once
  let avatarImg: Awaited<ReturnType<typeof loadImage>> | null = null;
  const avatarFirstFrame = avatarFrames ? avatarFrames.frames[0]! : avatarBuf;
  if (avatarFirstFrame) {
    try { avatarImg = await loadImage(avatarFirstFrame); } catch {}
  }

  const drawCard = async (bgBuf: Buffer | null) => {
    if (bgBuf) {
      try {
        ctx.drawImage(await loadImage(bgBuf), 0, 0, W, H);
      } catch (err) {
        console.warn("[rank] banner frame draw failed:", err);
        ctx.fillStyle = "#1e1e2e";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = "#1e1e2e";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "right";
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 58px sans-serif";
    ctx.fillText(`Level ${level}`, W - 36, 80);
    ctx.fillStyle = "#a6adc8";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(`Rank #${rank}`, W - 36, 128);
    ctx.textAlign = "left";

    const ax = AVATAR_X;
    const ay = AVATAR_CY - AVATAR_SIZE / 2;

    ctx.fillStyle = "#1e1e2e";
    ctx.beginPath();
    ctx.arc(ax + AVATAR_SIZE / 2, AVATAR_CY, AVATAR_SIZE / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + AVATAR_SIZE / 2, AVATAR_CY, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatarImg) {
      ctx.drawImage(avatarImg, ax, ay, AVATAR_SIZE, AVATAR_SIZE);
    } else {
      ctx.fillStyle = "#45475a";
      ctx.fillRect(ax, ay, AVATAR_SIZE, AVATAR_SIZE);
    }
    ctx.restore();

    const textX = AVATAR_X + AVATAR_SIZE + 20;
    const midY = H / 2;

    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 50px sans-serif";
    ctx.fillText(user.globalName ?? user.username, textX, midY - 10);
    ctx.fillStyle = "#a6adc8";
    ctx.font = "30px sans-serif";
    ctx.fillText(`@${user.username}`, textX, midY + 36);

    const barX = 18;
    const barY = H - 68;
    const barW = W - 36;
    const barH = 26;

    const { current, required } = xpProgress(xp, level);
    const fillW = Math.max(0, Math.min(barW, Math.floor((current / required) * barW)));

    ctx.fillStyle = "#313244";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 13);
    ctx.fill();

    if (fillW > 0) {
      ctx.fillStyle = "#89b4fa";
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 13);
      ctx.fill();
    }

    ctx.fillStyle = "#a6adc8";
    ctx.font = "24px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${current} / ${required} XP`, W - 36, barY - 8);
    ctx.textAlign = "left";
  };

  // Banner animation takes priority - fall back to avatar animation
  const frames = bannerFrames ?? avatarFrames;

  if (frames) {
    const gif = GIFEncoder();
    for (let i = 0; i < frames.frames.length; i++) {
      const bgBuf = bannerFrames ? frames.frames[i]! : (bannerBuf ?? null);
      await drawCard(bgBuf);
      encodeGIF(ctx, W, H, gif, frames.delays[i] ?? 100);
    }
    gif.finish();
    return { buffer: Buffer.from(gif.bytes()), animated: true };
  }

  await drawCard(bannerBuf);
  return { buffer: canvas.toBuffer("image/png"), animated: false };
}

export async function generateBalanceCard(opts: {
  user: User;
  bannerHash: string | null;
  balance: number;
  rank: number;
}): Promise<{ buffer: Buffer; animated: boolean }> {
  const { user, balance, rank } = opts;
  const bannerUrl = fluxerBannerURL(user.id, opts.bannerHash, 1024);
  const avatarUrl = fluxerDisplayAvatarURL(user, 256);

  const [bannerBuf, avatarBuf] = await Promise.all([
    bannerUrl ? fetchImageBuffer(bannerUrl) : Promise.resolve(null),
    fetchImageBuffer(avatarUrl),
  ]);

  const [bannerFrames, avatarFrames] = await Promise.all([
    bannerBuf ? extractFrames(bannerBuf) : Promise.resolve(null),
    avatarBuf ? extractFrames(avatarBuf) : Promise.resolve(null),
  ]);

  const W = 1250;
  const H = 400;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  let avatarImg: Awaited<ReturnType<typeof loadImage>> | null = null;
  const avatarFirstFrame = avatarFrames ? avatarFrames.frames[0]! : avatarBuf;
  if (avatarFirstFrame) {
    try { avatarImg = await loadImage(avatarFirstFrame); } catch {}
  }

  const drawCard = async (bgBuf: Buffer | null) => {
    if (bgBuf) {
      try {
        ctx.drawImage(await loadImage(bgBuf), 0, 0, W, H);
      } catch (err) {
        console.warn("[balance] banner frame draw failed:", err);
        ctx.fillStyle = "#1e1e2e";
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = "#1e1e2e";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "right";
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 58px sans-serif";
    ctx.fillText(String(balance), W - 36, 80);
    ctx.fillStyle = "#a6adc8";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("coins", W - 36, 122);
    ctx.fillStyle = "#6c7086";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(rank > 0 ? `Rank #${rank}` : "Unranked", W - 36, 160);
    ctx.textAlign = "left";

    const avatarSize = 150;
    const avatarCY = H - avatarSize / 2 - 20;
    const ax = AVATAR_X;
    const ay = avatarCY - avatarSize / 2;

    ctx.fillStyle = "#1e1e2e";
    ctx.beginPath();
    ctx.arc(ax + avatarSize / 2, avatarCY, avatarSize / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + avatarSize / 2, avatarCY, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatarImg) {
      ctx.drawImage(avatarImg, ax, ay, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = "#45475a";
      ctx.fillRect(ax, ay, avatarSize, avatarSize);
    }
    ctx.restore();

    const textX = AVATAR_X + avatarSize + 20;

    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(user.globalName ?? user.username, textX, avatarCY - 12);
    ctx.fillStyle = "#a6adc8";
    ctx.font = "34px sans-serif";
    ctx.fillText(`@${user.username}`, textX, avatarCY + 34);
  };

  const frames = bannerFrames ?? avatarFrames;

  if (frames) {
    const gif = GIFEncoder();
    for (let i = 0; i < frames.frames.length; i++) {
      const bgBuf = bannerFrames ? frames.frames[i]! : (bannerBuf ?? null);
      await drawCard(bgBuf);
      encodeGIF(ctx, W, H, gif, frames.delays[i] ?? 100);
    }
    gif.finish();
    return { buffer: Buffer.from(gif.bytes()), animated: true };
  }

  await drawCard(bannerBuf);
  return { buffer: canvas.toBuffer("image/png"), animated: false };
}

const RANK_COLORS: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
const LB_W = 1000;
const LB_ROW_H = 84;
const LB_HEADER_H = 90;
const LB_PADDING = 24;
const LB_AVATAR_SIZE = 52;

type XPEntry = { user: User; xp: number; level: number; rank: number; isYou: boolean; bannerHash: string | null };
type EcoEntry = { user: User; balance: number; rank: number; isYou: boolean; bannerHash: string | null };

export async function generateLeaderboardCard(opts: {
  entries: XPEntry[] | EcoEntry[];
  page: number;
  totalPages: number;
  mode?: "xp" | "economy";
}): Promise<Buffer> {
  const { entries, page, totalPages, mode = "xp" } = opts;
  const H = LB_HEADER_H + entries.length * LB_ROW_H + LB_PADDING;

  const [avatarBufs, bannerBufs] = await Promise.all([
    Promise.all(entries.map((e) => fetchImageBuffer(fluxerDisplayAvatarURL(e.user, 64)))),
    Promise.all(entries.map((e) => {
      const url = fluxerBannerURL(e.user.id, e.bannerHash, 512, false);
      return url ? fetchImageBuffer(url) : Promise.resolve(null);
    })),
  ]);

  const canvas = createCanvas(LB_W, H);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1e1e2e";
  ctx.fillRect(0, 0, LB_W, H);

  ctx.fillStyle = "#cdd6f4";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Leaderboard", 24, 58);

  ctx.textAlign = "right";
  ctx.fillStyle = mode === "economy" ? "#f9e2af" : "#89b4fa";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(mode === "economy" ? "Coins" : "XP", LB_W - 24, 38);
  ctx.fillStyle = "#585b70";
  ctx.font = "22px sans-serif";
  ctx.fillText(`page ${page} / ${totalPages}`, LB_W - 24, 66);
  ctx.textAlign = "left";

  ctx.fillStyle = "#313244";
  ctx.fillRect(0, LB_HEADER_H, LB_W, 2);

  for (let i = 0; i < entries.length; i++) {
    const { user, rank, isYou } = entries[i]!;
    const rowY = LB_HEADER_H + i * LB_ROW_H;
    const midY = rowY + LB_ROW_H / 2;

    const bannerBuf = bannerBufs[i];
    if (bannerBuf) {
      try {
        const img = await loadImage(bannerBuf);
        const scale = Math.max(LB_W / img.width, LB_ROW_H / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = (LB_W - drawW) / 2;
        const drawY = rowY + (LB_ROW_H - drawH) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, rowY, LB_W, LB_ROW_H);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } catch {}
    }

    ctx.fillStyle = bannerBuf ? "rgba(0,0,0,0.60)" : (isYou ? "rgba(137,180,250,0.10)" : (i % 2 === 1 ? "rgba(255,255,255,0.03)" : "transparent"));
    ctx.fillRect(0, rowY, LB_W, LB_ROW_H);

    // left accent strip for top 3
    const accentColor = RANK_COLORS[rank];
    if (accentColor) {
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, rowY, 4, LB_ROW_H);
    }

    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = accentColor ?? "#585b70";
    ctx.textAlign = "right";
    ctx.fillText(`#${rank}`, 72, midY + 9);
    ctx.textAlign = "left";

    const ax = 84;
    const ay = midY - LB_AVATAR_SIZE / 2;

    // avatar ring for top 3
    if (accentColor) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ax + LB_AVATAR_SIZE / 2, midY, LB_AVATAR_SIZE / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + LB_AVATAR_SIZE / 2, midY, LB_AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const buf = avatarBufs[i];
    if (buf) {
      try {
        const img = await loadImage(buf);
        ctx.drawImage(img, ax, ay, LB_AVATAR_SIZE, LB_AVATAR_SIZE);
      } catch {
        ctx.fillStyle = "#45475a";
        ctx.fillRect(ax, ay, LB_AVATAR_SIZE, LB_AVATAR_SIZE);
      }
    } else {
      ctx.fillStyle = "#45475a";
      ctx.fillRect(ax, ay, LB_AVATAR_SIZE, LB_AVATAR_SIZE);
    }
    ctx.restore();

    const nameX = ax + LB_AVATAR_SIZE + 16;
    ctx.fillStyle = isYou ? "#89b4fa" : "#cdd6f4";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(user.globalName ?? user.username, nameX, midY - 4);
    ctx.fillStyle = "#6c7086";
    ctx.font = "20px sans-serif";
    ctx.fillText(`@${user.username}`, nameX, midY + 22);

    ctx.textAlign = "right";
    ctx.fillStyle = "#cdd6f4";
    ctx.font = "bold 24px sans-serif";
    if (mode === "economy") {
      const eco = entries[i] as EcoEntry;
      ctx.fillText(eco.balance.toLocaleString(), LB_W - 24, midY - 4);
      ctx.fillStyle = "#a6adc8";
      ctx.font = "20px sans-serif";
      ctx.fillText("coins", LB_W - 24, midY + 22);
    } else {
      const xpEntry = entries[i] as XPEntry;
      ctx.fillText(`Level ${xpEntry.level}`, LB_W - 24, midY - 4);
      ctx.fillStyle = "#a6adc8";
      ctx.font = "20px sans-serif";
      ctx.fillText(`${xpEntry.xp} XP`, LB_W - 24, midY + 22);
    }
    ctx.textAlign = "left";

    ctx.fillStyle = "#313244";
    ctx.fillRect(0, rowY + LB_ROW_H - 1, LB_W, 1);
  }

  return canvas.toBuffer("image/png");
}
