/**
 * Placeholder tattoo photos for the home artwork marquee (styling pass).
 * Real gallery work replaces these as soon as /api/portfolio has images.
 */
function unsplashPhoto(id, width, height) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

export const PLACEHOLDER_ARTWORK = [
  {
    id: 'placeholder-session-portrait',
    src: unsplashPhoto('photo-1568515045052-f9a854d70bfd', 480, 720),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-back-piece',
    src: unsplashPhoto('photo-1598371839696-5c5bb00bdc28', 960, 640),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-shoulder',
    src: unsplashPhoto('photo-1605497788044-5a32c7078486', 560, 800),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-linework',
    src: unsplashPhoto('photo-1568515387631-8b650bbcdb90', 480, 720),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-ink',
    src: unsplashPhoto('photo-1552627019-947c3789ffb5', 800, 640),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-shoulder-wide',
    src: unsplashPhoto('photo-1605497788044-5a32c7078486', 880, 640),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-session-wide',
    src: unsplashPhoto('photo-1568515045052-f9a854d70bfd', 960, 640),
    alt: 'Placeholder tattoo artwork'
  },
  {
    id: 'placeholder-back-portrait',
    src: unsplashPhoto('photo-1598371839696-5c5bb00bdc28', 520, 780),
    alt: 'Placeholder tattoo artwork'
  }
];
