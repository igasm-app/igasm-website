// Reads the code in an invite link (igasm.in/c#CODE). Mirrors the app's own reader
// (igasm features/partners/codeShape.ts) so the site and the app agree on what a code is:
// - an invite code (a partner link): 24 hex characters, redeemed lower case;
// - a room code: 8 letters and digits, redeemed upper case.
// Any grouping or case is fine (#K7Q2-M9XA, #k7q2m9xa, #3f9a 01bc ...). Pure, node-testable.

export const INVITE_CODE_LENGTH = 24;
export const ROOM_CODE_LENGTH = 8;

/** The deep link the app's one code box takes (expo-router app/rooms/join.tsx, `?code=`). */
export const APP_SCHEME = "igasm";
export const appLink = (code) => `${APP_SCHEME}://rooms/join?code=${encodeURIComponent(code)}`;

/** { kind, code } for a fragment that holds a code, else null. Never throws. */
export function readFragment(hash) {
  let raw = typeof hash === "string" ? hash : "";
  if (raw.startsWith("#")) raw = raw.slice(1);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* a malformed escape: read it as typed */
  }
  if (raw.length > 64) return null;
  const body = raw.replace(/[^A-Za-z0-9]/g, "");
  if (body.length === INVITE_CODE_LENGTH && /^[0-9a-fA-F]+$/.test(body)) return { kind: "invite", code: body.toLowerCase() };
  if (body.length === ROOM_CODE_LENGTH) return { kind: "room", code: body.toUpperCase() };
  return null;
}

/** Upper case, in groups of four, as the app shows a code (components/rooms/CodeReveal.tsx). */
export function groups(code) {
  const shown = code.toUpperCase();
  const out = [];
  for (let i = 0; i < shown.length; i += 4) out.push(shown.slice(i, i + 4));
  return out;
}
