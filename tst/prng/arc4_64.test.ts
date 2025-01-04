
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { arc4_64 } from '../../src/prng/arc4';
import { hex } from '../../src/codec';

const tsts = suite('arc4_64');

//There's no source for this, just showing without a key a reasonable random stream is created
const rng0=arc4_64();
const seq0:string[]=[
    '2C1BC8CDB25FDB06',
    '0A61F50C51DA5E06',
    '50B2B97C5F129341',
    'B9F1EB5FC42A917D',
];
let i=0;
for (const expect of seq0) {
    const act = rng0();
    tsts(`arc4_32()[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesLE()),expect);
    });
    i++;
}

//From, in littleEndian order
//https://datatracker.ietf.org/doc/html/rfc6229
const key_12345=Uint8Array.of(1,2,3,4,5);
const rng_12345=arc4_64(key_12345);
const seq_12345: string[] = [
    'B2396305F03DC027',
    'CCC3524A0A1118A8',
    '6982944F18FC82D5',
    '89C403A47A0D0919'
];
i=0;
for (const expect of seq_12345) {
	const act = rng_12345();
	tsts(`arc4_64(key_12345)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesLE()),expect);
	});
	i++;
}

const rng_12345_drop=arc4_64(key_12345,1024);
const seq_12345_drop: string[] = [
    '30ABBCC7C20B0160',
    '9F23EE2D5F6BB7DF',
];
i=0;
for (const expect of seq_12345_drop) {
    const act = rng_12345_drop();
    tsts(`arc4_64(key_12345,1024)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesLE()),expect);
    });
    i++;
}

const key_1234567=Uint8Array.of(1,2,3,4,5,6,7);
const rng_1234567=arc4_64(key_1234567);
const seq_1234567: string[] = [
    '293F02D47F37C9B6',
    '33F2AF5285FEB46B',
    'E620F1390D19BD84',
    'E2E0FD752031AFC1'
];
i=0;
for (const expect of seq_1234567) {
	const act = rng_1234567();
	tsts(`arc4_64(key_1234567)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesLE()),expect);
	});
	i++;
}

const key_833222772a=Uint8Array.of(0x83,0x32,0x22,0x77,0x2a);
const seq_833222772a: string[] = [
    '80AD97BDC973DF8A',
    '2E879E92A497EFDA',
    '20F060C2F2E51265',
    '01D3D4FEA10D5FC0'
];
const rng_833222772a=arc4_64(key_833222772a);
i=0;
for (const expect of seq_833222772a) {
	const act = rng_833222772a();
	tsts(`arc4_64(key_833222772a)[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesLE()),expect);
	});
	i++;
}

tsts.run();
