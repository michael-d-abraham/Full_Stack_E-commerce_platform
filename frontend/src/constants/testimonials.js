/**
 * Placeholder client reviews for the home testimonial marquee (styling pass).
 */
function avatarUrl(name) {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=88&background=e8e8e8&color=333333&format=svg`;
}

export const PLACEHOLDER_TESTIMONIALS = [
  {
    id: 'maya-thornton',
    quote:
      "Stumbled across this portfolio and couldn't stop clicking through it. The interactions feel alive.",
    name: 'Maya Thornton',
    role: 'Lead Designer @company',
    avatarUrl: avatarUrl('Maya Thornton')
  },
  {
    id: 'rafael-osei',
    quote:
      "The level of craft here sets a new bar. I'm sending this to our entire design team.",
    name: 'Rafael Osei',
    role: 'Founder @XYZ',
    avatarUrl: avatarUrl('Rafael Osei')
  },
  {
    id: 'priya-menon',
    quote:
      'Rarely do I see someone nail both the engineering and the aesthetics this consistently.',
    name: 'Priya Menon',
    role: 'Staff Engineer @coolcompany',
    avatarUrl: avatarUrl('Priya Menon')
  },
  {
    id: 'luca-ferreira',
    quote:
      'Every scroll, every transition — nothing is accidental here. Beautifully intentional work.',
    name: 'Luca Ferreira',
    role: 'Creative Director @bigcompany',
    avatarUrl: avatarUrl('Luca Ferreira')
  },
  {
    id: 'nora-halstrom',
    quote:
      'This is the portfolio I wish I had built. The micro-interactions alone are worth studying.',
    name: 'Nora Halstrom',
    role: 'Co-founder @startup',
    avatarUrl: avatarUrl('Nora Halstrom')
  },
  {
    id: 'dmitri-volkov',
    quote:
      'You can feel the hours of iteration behind every component. Exceptional taste.',
    name: 'Dmitri Volkov',
    role: 'Design Engineer @pbcompany',
    avatarUrl: avatarUrl('Dmitri Volkov')
  },
  {
    id: 'selin-aydin',
    quote:
      "I've reviewed hundreds of portfolios this year. This one is in a category of its own.",
    name: 'Selin Aydın',
    role: 'Product @another',
    avatarUrl: avatarUrl('Selin Aydin')
  }
];
