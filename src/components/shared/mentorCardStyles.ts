/**
 * Shared mentor card renderer styles and helpers.
 * Used by MentorShareButton and AdminMentorCardsPanel for consistent PNG export cards.
 */

const MAX_MESSAGE_CHARS = 220;

export const truncateMessage = (text: string, maxChars = MAX_MESSAGE_CHARS): string => {
  // Remove excessive line breaks
  const cleaned = text.replace(/\n{2,}/g, "\n").trim();
  if (cleaned.length <= maxChars) return cleaned;
  // Cut at last word boundary before maxChars
  const truncated = cleaned.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.6 ? truncated.slice(0, lastSpace) : truncated) + "...";
};

export const getDefaultMessage = (area: string) =>
  `Venha agendar uma sessão de mentoria comigo sobre ${area}, e coloque sua carreira em movimento! 🚀`;

export const getDisplayMessage = (cardMessage: string | null, area: string) =>
  truncateMessage(cardMessage || getDefaultMessage(area));

/** No truncation for name/area — allow wrapping instead */
export const truncateName = (name: string): string => name;
export const truncateArea = (area: string): string => area;

// ─── Inline style objects (for html2canvas compatibility) ───

export const cardContainerStyle = (size: number): React.CSSProperties => ({
  background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #f59e0b 100%)",
  width: `${size}px`,
  height: `${size}px`,
  padding: `${Math.round(size * 0.06)}px`,
  borderRadius: `${Math.round(size * 0.048)}px`,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  color: "white",
  fontFamily: "system-ui, -apple-system, sans-serif",
});

export const decorCircle1 = (size: number): React.CSSProperties => ({
  position: "absolute",
  top: `${-size * 0.08}px`,
  right: `${-size * 0.08}px`,
  width: `${size * 0.32}px`,
  height: `${size * 0.32}px`,
  borderRadius: "50%",
  border: `${Math.round(size * 0.012)}px solid rgba(255,255,255,0.1)`,
});

export const decorCircle2 = (size: number): React.CSSProperties => ({
  position: "absolute",
  bottom: `${-size * 0.12}px`,
  left: `${-size * 0.12}px`,
  width: `${size * 0.4}px`,
  height: `${size * 0.4}px`,
  borderRadius: "50%",
  border: `${Math.round(size * 0.012)}px solid rgba(255,255,255,0.15)`,
});

export const sparkle1 = (size: number): React.CSSProperties => ({
  position: "absolute",
  top: `${size * 0.064}px`,
  left: `${size * 0.064}px`,
  width: `${size * 0.016}px`,
  height: `${size * 0.016}px`,
  borderRadius: "50%",
  backgroundColor: "white",
});

export const sparkle2 = (size: number): React.CSSProperties => ({
  position: "absolute",
  top: `${size * 0.128}px`,
  right: `${size * 0.128}px`,
  width: `${size * 0.024}px`,
  height: `${size * 0.024}px`,
  borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.8)",
});
