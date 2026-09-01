const { detectVideoMime, validateVideoBuffer } = require('../server/utils/videoMime');

function makeMp4Buffer() {
    const buffer = Buffer.alloc(16);
    buffer.write('....ftypmp42', 0, 'ascii');
    return buffer;
}

function makeWebmBuffer() {
    const buffer = Buffer.alloc(8);
    buffer[0] = 0x1a;
    buffer[1] = 0x45;
    buffer[2] = 0xdf;
    buffer[3] = 0xa3;
    return buffer;
}

describe('videoMime', () => {
    it('detectVideoMime recognizes mp4', () => {
        expect(detectVideoMime(makeMp4Buffer())).toBe('video/mp4');
    });

    it('detectVideoMime recognizes webm', () => {
        expect(detectVideoMime(makeWebmBuffer())).toBe('video/webm');
    });

    it('validateVideoBuffer accepts mp4', () => {
        expect(validateVideoBuffer(makeMp4Buffer(), 'video/mp4')).toBe('video/mp4');
    });

    it('validateVideoBuffer rejects invalid files', () => {
        expect(() => validateVideoBuffer(Buffer.from('not-a-video'), 'video/mp4')).toThrow(/valid MP4/);
    });
});
