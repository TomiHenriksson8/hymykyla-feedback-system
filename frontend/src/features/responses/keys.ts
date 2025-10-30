export const qkResponses = {
  list: (p?: Record<string, unknown>) =>
    p && Object.keys(p).length
      ? (["responses", JSON.stringify(p)] as const)
      : (["responses", "all"] as const),
};
