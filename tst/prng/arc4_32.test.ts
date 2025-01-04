
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { arc4_32 } from '../../src/prng/arc4';
import { U32 } from '../../src/primitive/number/U32';
import { hex } from '../../src/codec/Hex';

const tsts = suite('arc4_32');

//There's no source for this, just showing without a key a reasonable random stream is created
const rng0=arc4_32();
const seq0:number[]=[
    3452443436,
    115040178,
    217407754,
    106879569
];
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`arc4_32()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Source: https://datatracker.ietf.org/doc/html/rfc6229
const key_12345=Uint8Array.of(1,2,3,4,5);
const rng_12345=arc4_32(key_12345);
const seq_12345: string[] = [
    'B2396305',
    'F03DC027',
    'CCC3524A',
    '0A1118A8',
    '6982944F',
    '18FC82D5',
    '89C403A4',
    '7A0D0919'
];
i=0;
for (const expect of seq_12345) {
	const act = rng_12345();
	tsts(`arc4_32(key_12345)[${i}]`, () => {
        //This slightly complicated cast shows the bytes in RFC6229 order to help with cross reference
        assert.equal(hex.fromBytes(U32.fromIntUnsafe(act).toBytesLE()),expect);
	});
	i++;
}

const rng_12345_drop=arc4_32(key_12345,1024);
const seq_12345_drop: string[] = [
    '30ABBCC7',
    'C20B0160',
    '9F23EE2D',
    '5F6BB7DF',
];
i=0;
for (const expect of seq_12345_drop) {
	const act = rng_12345_drop();
	tsts(`arc4_32(key_12345,1024)[${i}]`, () => {
        assert.equal(hex.fromBytes(U32.fromIntUnsafe(act).toBytesLE()),expect);
	});
	i++;
}

const key_1234567=Uint8Array.of(1,2,3,4,5,6,7);
const rng_1234567=arc4_32(key_1234567);
const seq_1234567: string[] = [
    '293F02D4',
    '7F37C9B6',
    '33F2AF52',
    '85FEB46B',
    'E620F139',
    '0D19BD84',
    'E2E0FD75',
    '2031AFC1'
];
i=0;
for (const expect of seq_1234567) {
	const act = rng_1234567();
	tsts(`arc4_32(key_1234567)[${i}]`, () => {
        assert.equal(hex.fromBytes(U32.fromIntUnsafe(act).toBytesLE()),expect);
	});
	i++;
}

const key_833222772a=Uint8Array.of(0x83,0x32,0x22,0x77,0x2a);
const rng_833222772a=arc4_32(key_833222772a);
const seq_833222772a: string[] = [
    '80AD97BD',
    'C973DF8A',
    '2E879E92',
    'A497EFDA',
    '20F060C2',
    'F2E51265',
    '01D3D4FE',
    'A10D5FC0'
];
i=0;
for (const expect of seq_833222772a) {
	const act = rng_833222772a();
	tsts(`arc4_32(key_833222772a)[${i}]`, () => {
        assert.equal(hex.fromBytes(U32.fromIntUnsafe(act).toBytesLE()),expect);
	});
	i++;
}

tsts.run();
