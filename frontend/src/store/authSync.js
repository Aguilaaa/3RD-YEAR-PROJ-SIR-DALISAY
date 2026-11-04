/** Bumps when local auth actions should ignore a stale Firebase callback. */
export const authTicket = { current: 0 };

export function bumpAuthTicket() {
  authTicket.current += 1;
  return authTicket.current;
}
