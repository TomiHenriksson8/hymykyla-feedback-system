export const qk = {
  list: (p?: Record<string, unknown>) =>
    p && Object.keys(p).length
      ? (["surveys", JSON.stringify(p)] as const) // stable
      : (["surveys", "all"] as const),
  one: (id: string) => ["survey", id] as const,
  active: ["surveys", "active"] as const,
};


