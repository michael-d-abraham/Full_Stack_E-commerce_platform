/**
 * @jest-environment node
 */

const {
  isImageKitUrl,
  buildImageKitSrc,
  buildSrcSet
} = require('../frontend/src/utils/imageKitUrl.js');

describe('imageKitUrl', () => {
  const base = 'https://ik.imagekit.io/demo/artist-site/products/a.jpg';

  it('detects ImageKit hosts', () => {
    expect(isImageKitUrl(base)).toBe(true);
    expect(isImageKitUrl('https://cdn.example.com/a.jpg')).toBe(false);
  });

  it('builds width transforms', () => {
    expect(buildImageKitSrc(base, { width: 640, quality: 80 })).toBe(
      'https://ik.imagekit.io/demo/tr:w-640,q-80,f-auto/artist-site/products/a.jpg'
    );
  });

  it('uses contain fit when both width and height are set (no crop)', () => {
    expect(buildImageKitSrc(base, { width: 640, height: 480, quality: 80 })).toBe(
      'https://ik.imagekit.io/demo/tr:w-640,h-480,c-at_max,q-80,f-auto/artist-site/products/a.jpg'
    );
  });

  it('passes through non-ImageKit URLs', () => {
    const other = 'https://cdn.example.com/a.jpg';
    expect(buildImageKitSrc(other, { width: 640 })).toBe(other);
  });

  it('replaces existing transforms', () => {
    const withTr = 'https://ik.imagekit.io/demo/tr:w-100/artist-site/products/a.jpg';
    expect(buildImageKitSrc(withTr, { width: 800, quality: 70 })).toBe(
      'https://ik.imagekit.io/demo/tr:w-800,q-70,f-auto/artist-site/products/a.jpg'
    );
  });

  it('builds srcset', () => {
    const set = buildSrcSet(base, [320, 640]);
    expect(set).toContain('320w');
    expect(set).toContain('640w');
    expect(set.split(', ')).toHaveLength(2);
  });
});
