import type { AnalyticsEventType } from "@qre/contracts";

export type AnalyticsEvent = {
  assetId: string;
  timestamp: Date;
  sessionId?: string | null;
  type: AnalyticsEventType | string;
  meta?: any;
};

export type Insight = {
  type: "ALERT" | "SUGGESTION" | "ANALYTICS";
  title: string;
  message: string;
  confidence: number;
  metric?: string;
  value?: number;
};

const count = (events: AnalyticsEvent[], type: string) => events.filter((event) => event.type === type).length;
const ratio = (n: number, d: number) => d > 0 ? n / d : 0;

/**
 * Pure experience-intelligence pass. It does not invent facts; it derives
 * bounded behavioral signals from observed runtime analytics.
 */
export function aiInsightsEngine(events: AnalyticsEvent[]): Insight[] {
  if (!events.length) return [];
  const insights: Insight[] = [];
  const scans = count(events, "SCAN");
  const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean)).size;
  const completions = count(events, "FLOW_COMPLETE") + count(events, "SESSION_END");
  const abandons = count(events, "FLOW_ABANDON");
  const replays = count(events, "MEDIA_REPLAY") + count(events, "EXPERIENCE_REPLAY");
  const mediaStarts = count(events, "MEDIA_PLAY");
  const mediaCompletes = count(events, "MEDIA_COMPLETE");
  const ctaClicks = count(events, "CTA_CLICK");
  const ticketsCreated = count(events, "TICKET_CREATED");
  const ticketsRedeemed = count(events, "TICKET_REDEEMED");
  const memoriesCreated = count(events, "MEMORY_CREATED") + count(events, "AI_MEMORY_LEARNED");
  const memoriesRecommended = count(events, "MEMORY_RECOMMENDED") + count(events, "MEMORY_RECOMMENDATION_VIEWED");
  const memorySelections = count(events, "MEMORY_RECOMMENDATION_SELECTED");
  const creativeAccepted = count(events, "AI_CREATIVE_ACCEPTED");
  const creativeRejected = count(events, "AI_CREATIVE_REJECTED");

  const completionRate = ratio(completions, Math.max(scans, sessions));
  const abandonmentRate = ratio(abandons, Math.max(scans, sessions));
  const replayRate = ratio(replays, Math.max(1, scans));
  const mediaCompletionRate = ratio(mediaCompletes, mediaStarts);
  const ctaRate = ratio(ctaClicks, Math.max(1, sessions));
  const ticketRedemptionRate = ratio(ticketsRedeemed, ticketsCreated);
  const memoryRecommendationRate = ratio(memorySelections, memoriesRecommended);
  const creativeAcceptanceRate = ratio(creativeAccepted, creativeAccepted + creativeRejected);

  if (completionRate >= 0.75 && sessions >= 5) insights.push({ type: "ANALYTICS", title: "Strong Experience Completion", message: "Most sessions reach the end of the experience.", confidence: Math.min(0.98, 0.65 + completionRate * 0.3), metric: "completionRate", value: completionRate });
  if (abandonmentRate >= 0.25 && sessions >= 5) insights.push({ type: "ALERT", title: "Experience Friction", message: "A meaningful share of sessions abandon before completion.", confidence: Math.min(0.96, 0.6 + abandonmentRate), metric: "abandonmentRate", value: abandonmentRate });
  if (replayRate >= 0.15 && scans >= 5) insights.push({ type: "ANALYTICS", title: "Replay Signal", message: "People are returning to replay the experience; the content has revisit value.", confidence: 0.86, metric: "replayRate", value: replayRate });
  if (mediaStarts >= 5 && mediaCompletionRate < 0.5) insights.push({ type: "SUGGESTION", title: "Media Attention Drop", message: "A large share of started media is not reaching completion; shorten or reorder the visual sequence.", confidence: 0.82, metric: "mediaCompletionRate", value: mediaCompletionRate });
  if (ctaRate >= 0.12 && sessions >= 5) insights.push({ type: "ANALYTICS", title: "Strong Call-To-Action Interest", message: "The experience is driving unusually strong next-step activity.", confidence: 0.84, metric: "ctaRate", value: ctaRate });
  if (ticketsCreated >= 5 && ticketRedemptionRate < 0.5) insights.push({ type: "SUGGESTION", title: "Ticket Conversion Gap", message: "Many issued event tickets have not converted to attendance yet.", confidence: 0.8, metric: "ticketRedemptionRate", value: ticketRedemptionRate });
  if (ticketsCreated >= 5 && ticketRedemptionRate >= 0.8) insights.push({ type: "ANALYTICS", title: "High Event Attendance", message: "Issued QR tickets are converting strongly into check-ins.", confidence: 0.93, metric: "ticketRedemptionRate", value: ticketRedemptionRate });
  if (memoriesRecommended >= 5 && memoryRecommendationRate >= 0.25) insights.push({ type: "ANALYTICS", title: "Memory Discovery Works", message: "People are selecting recommended memories, indicating useful continuity across experiences.", confidence: 0.87, metric: "memoryRecommendationRate", value: memoryRecommendationRate });
  if (memoriesCreated >= 3) insights.push({ type: "ANALYTICS", title: "The Memory Graph Is Growing", message: "Users are actively adding or generating durable memory state.", confidence: 0.84, metric: "memoriesCreated", value: memoriesCreated });
  if (creativeAccepted + creativeRejected >= 5 && creativeAcceptanceRate < 0.45) insights.push({ type: "ALERT", title: "Creative Taste Mismatch", message: "Creative output is being rejected frequently; increase novelty pressure and avoid the recently rejected patterns.", confidence: 0.86, metric: "creativeAcceptanceRate", value: creativeAcceptanceRate });
  if (creativeAccepted + creativeRejected >= 5 && creativeAcceptanceRate >= 0.8) insights.push({ type: "ANALYTICS", title: "Creative Alignment", message: "Creative output is being accepted consistently; preserve the learned style while varying language.", confidence: 0.89, metric: "creativeAcceptanceRate", value: creativeAcceptanceRate });

  const hourMap = new Map<number, number>();
  for (const event of events) {
    const hour = new Date(event.timestamp).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  if (hourMap.size >= 4) {
    const [peakHour, peakCount] = [...hourMap.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    const total = [...hourMap.values()].reduce((sum, value) => sum + value, 0);
    if (peakCount / Math.max(1, total) >= 0.3) insights.push({ type: "ANALYTICS", title: "Peak Attention Window", message: `The experience receives its strongest activity around ${peakHour}:00.`, confidence: 0.79, metric: "peakHour", value: peakHour });
  }

  const sessionMap = new Map<string, number>();
  for (const event of events) if (event.sessionId) sessionMap.set(event.sessionId, (sessionMap.get(event.sessionId) ?? 0) + 1);
  const repeatSessions = [...sessionMap.values()].filter((value) => value > 2).length;
  if (repeatSessions >= 3) insights.push({ type: "SUGGESTION", title: "Retention Opportunity", message: "Several sessions show repeated interaction; a loyalty or return-memory layer may be valuable.", confidence: 0.85, metric: "repeatSessions", value: repeatSessions });

  return insights;
}
