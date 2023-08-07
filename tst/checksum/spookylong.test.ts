import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { SpookyLong } from '../../src/checksum';
import { U64 } from '../../src/primitive';

const tsts = suite('Spooky');

const testLong:[Uint8Array,[U64,U64],string][]=[
    //wikipedia: 219 bytes
    [
        utf8.toBytes('The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog'),
        [U64.zero,U64.zero],
        "F1B71C6AC5AF39E7B69363A60DD29C49"
    ],
    //200 chars > 192, should use long
    [
        utf8.toBytes('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'),
        [U64.zero,U64.zero],
        "242105FF3E9B7EC465CD7515C36B776B"
    ],
    [
        new Uint8Array(0),
        [U64.fromInt(1),U64.zero],
        '56CB02C75F911EE2FC2FE69AF0D0092E'
    ],
    [
        Uint8Array.of(1,2,3),
        [U64.fromInt(1),U64.zero],
        '009933E165F0584756F1C2CB746B6919'
    ]
];
let count=0;
for (const [data,seed,expect] of testLong) {
    tsts(`SpookyLong[${count++}]`,()=>{
		const hash=new SpookyLong(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}

tsts(`reset`,()=>{
    const h=new SpookyLong(U64.fromInt(1));
    const sumEmpty='56CB02C75F911EE2FC2FE69AF0D0092E';
    const sum123='009933E165F0584756F1C2CB746B6919';
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
    h.write(Uint8Array.of(1,2,3));
    assert.is(hex.fromBytes(h.sum()),sum123);
    h.reset();
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
});

tsts(`newEmpty`,()=>{
    const h=new SpookyLong(U64.fromInt(1));
    const sumEmpty='56CB02C75F911EE2FC2FE69AF0D0092E';
    const sum123='009933E165F0584756F1C2CB746B6919';

    assert.is(hex.fromBytes(h.sum()),sumEmpty);

    h.write(Uint8Array.of(1,2,3));
    assert.is(hex.fromBytes(h.sum()),sum123);
    assert.is(hex.fromBytes(h.sum()),sum123,'double sum doesn\'t mutate');

    const h2=h.newEmpty();
    assert.is(hex.fromBytes(h2.sum()),sumEmpty);

});

tsts.run();