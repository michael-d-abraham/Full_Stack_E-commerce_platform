/**
 * Placeholder client reviews for the home testimonial marquee (styling pass).
 */
function avatarUrl(name) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=88&background=ecc8d8&color=3d2a32&format=svg`;
}

export const PLACEHOLDER_TESTIMONIALS = [
  {
    id: 'maya-thornton',
    quote:
      "stumbled across this portfolio and couldn't stop clicking through it. the interactions feel alive.",
    name: 'maya thornton',
    role: 'lead designer @company',
    avatarUrl: avatarUrl('maya thornton')
  },
  {
    id: 'rafael-osei',
    quote:
      "the level of craft here sets a new bar. i'm sending this to our entire design team.",
    name: 'rafael osei',
    role: 'founder @xyz',
    avatarUrl: avatarUrl('rafael osei')
  },
  {
    id: 'priya-menon',
    quote:
      'rarely do i see someone nail both the engineering and the aesthetics this consistently.',
    name: 'priya menon',
    role: 'staff engineer @coolcompany',
    avatarUrl: avatarUrl('priya menon')
  },
  {
    id: 'luca-ferreira',
    quote:
      'every scroll, every transition — nothing is accidental here. beautifully intentional work.',
    name: 'luca ferreira',
    role: 'creative director @bigcompany',
    avatarUrl: avatarUrl('luca ferreira')
  },
  {
    id: 'nora-halstrom',
    quote:
      'this is the portfolio i wish i had built. the micro-interactions alone are worth studying.',
    name: 'nora halstrom',
    role: 'co-founder @startup',
    avatarUrl: avatarUrl('nora halstrom')
  },
  {
    id: 'dmitri-volkov',
    quote:
      'you can feel the hours of iteration behind every component. exceptional taste.',
    name: 'dmitri volkov',
    role: 'design engineer @pbcompany',
    avatarUrl: avatarUrl('dmitri volkov')
  },
  {
    id: 'selin-aydin',
    quote:
      "i've reviewed hundreds of portfolios this year. this one is in a category of its own.",
    name: 'selin aydın',
    role: 'product @another',
    avatarUrl: avatarUrl('selin aydin')
  }
];
