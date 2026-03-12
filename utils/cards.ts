const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export type Card = { suit: string; value: string };

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const value of VALUES)
      deck.push({ suit, value });
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function bjValue(card: Card): number {
  if (["J", "Q", "K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

export function handValue(hand: Card[]): number {
  let total = hand.reduce((s, c) => s + bjValue(c), 0);
  let aces = hand.filter((c) => c.value === "A").length;
  while (total > 21 && aces-- > 0) total -= 10;
  return total;
}

export function cardRank(card: Card): number {
  if (card.value === "A") return 1;
  if (card.value === "J") return 11;
  if (card.value === "Q") return 12;
  if (card.value === "K") return 13;
  return parseInt(card.value);
}

export function fmt(card: Card): string {
  return `\`${card.value}${card.suit}\``;
}

export function fmtHand(hand: Card[]): string {
  return hand.map(fmt).join(" ");
}
