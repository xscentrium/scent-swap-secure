// Xscentrium brand styles for transactional / auth emails.
// Email body bg MUST be white (#ffffff) — this is a hard rule for inbox compatibility.
const GOLD = '#c79a4a'
const GOLD_DARK = '#a07a30'
const INK = '#1a1714'
const MUTED = '#6b6760'
const BORDER = '#ece7df'
const SERIF =
  "'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export const brand = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: SANS,
    margin: 0,
    padding: '32px 0',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '40px 36px 32px',
    backgroundColor: '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '6px',
  },
  brandRow: {
    textAlign: 'center' as const,
    margin: '0 0 28px',
    paddingBottom: '24px',
    borderBottom: `1px solid ${BORDER}`,
  },
  wordmark: {
    fontFamily: SERIF,
    fontSize: '22px',
    fontWeight: 500 as const,
    letterSpacing: '0.18em',
    color: INK,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  tagline: {
    fontSize: '10px',
    letterSpacing: '0.28em',
    color: GOLD,
    textTransform: 'uppercase' as const,
    margin: '6px 0 0',
  },
  h1: {
    fontFamily: SERIF,
    fontSize: '26px',
    fontWeight: 500 as const,
    color: INK,
    margin: '0 0 18px',
    lineHeight: 1.2,
  },
  text: {
    fontSize: '15px',
    color: '#3a3631',
    lineHeight: 1.65,
    margin: '0 0 20px',
  },
  link: { color: GOLD_DARK, textDecoration: 'underline' },
  button: {
    backgroundColor: GOLD,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600 as const,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    borderRadius: '2px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  code: {
    display: 'inline-block',
    fontFamily: "'SF Mono', Menlo, Consolas, monospace",
    fontSize: '24px',
    fontWeight: 700 as const,
    letterSpacing: '0.32em',
    color: INK,
    backgroundColor: '#f7f3ec',
    border: `1px solid ${BORDER}`,
    padding: '14px 22px',
    borderRadius: '4px',
    margin: '0 0 28px',
  },
  divider: {
    borderTop: `1px solid ${BORDER}`,
    margin: '28px 0 18px',
  },
  footer: {
    fontSize: '11px',
    color: MUTED,
    lineHeight: 1.6,
    margin: '0',
  },
  footerLegal: {
    fontSize: '10px',
    color: '#9a948a',
    lineHeight: 1.6,
    margin: '12px 0 0',
    textAlign: 'center' as const,
    letterSpacing: '0.04em',
  },
}
