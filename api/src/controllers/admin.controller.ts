

/** Basic admin health & identity check */
export const health = (_req: any, res: any) => {
  res.json({ ok: true, time: new Date().toISOString() });
};

export const me = (req: any, res: any) => {
  const user = (req as any).user;
  res.json({ ok: true, user });
};
