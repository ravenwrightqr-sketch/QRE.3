    /\b(?:for|with)\s+(?:all\s+the\s+|the\s+)?([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*)*)\s+(?:at|in|on|during)\s+(?:my|our|the|this|that)?\s*([^,.!?]+?)(?:\s+(?:tonight|today|now)\b|[,.!?]|$)/i,
  );
  if (audienceContext) {
    const audienceValue = clean(audienceContext[1] ?? "");
    const contextValue = clean(audienceContext[2] ?? "");
    if (audienceWords.has(audienceValue.toLowerCase()) && contextValue && contextValue.length <= 80) {
      return contextValue;
    }
  }

  const possessive = clean(text.match(/\bmy\s+([^,.!?]+?)(?:[,.!?]|$)/i)?.[1] ?? "");
  if (possessive && possessive.length <= 80 && !audienceWords.has(possessive.toLowerCase())) {
    return possessive;
  }

  return value.products[0] ?? value.events[0] ?? value.places[0] ?? value.people[0] ??
    (tokens(prompt)
      .filter((word) => !STOP.has(word.toLowerCase()))
      .filter((word) => !audienceWords.has(word.toLowerCase()))
      .slice(0, 5)
      .join(" ") || "this moment");
}

function activity(prompt: string, plan?: CognitiveExperiencePlan): string {
  const direction = lower(plan?.direction ?? "");
  const directionActivity: Record<string, string> = {