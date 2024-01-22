import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import {
	RipeMd128, RipeMd160, RipeMd256, RipeMd320,
} from '../../../src/crypto/hash';

const tsts = suite('RipeMd - SLOW');

const a64_bytes=utf8.toBytes('a'.repeat(64));


tsts('RipeMd128: a.repeat(1000000)', () => {
    const hash=new RipeMd128();
    //15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);

    const md=hash.sum();
	assert.is(hex.fromBytes(md), '4A7F5723F954EBA1216C9D8F6320431F');
});
tsts('RipeMd160: a.repeat(1000000)', () => {
    const hash=new RipeMd160();
    //15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);

    const md=hash.sum();
	assert.is(hex.fromBytes(md), '52783243C1697BDBE16D37F97F68F08325DC1528');
});
tsts('RipeMd256: a.repeat(1000000)', () => {
    const hash=new RipeMd256();
    //15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);

    const md=hash.sum();
	assert.is(hex.fromBytes(md), 'AC953744E10E31514C150D4D8D7B677342E33399788296E43AE4850CE4F97978');
});
tsts('RipeMd320: a.repeat(1000000)', () => {
    const hash=new RipeMd320();
    //15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);

    const md=hash.sum();
	assert.is(hex.fromBytes(md), 'BDEE37F4371E20646B8B0D862DDA16292AE36F40965E8C8509E63D1DBDDECC503E2B63EB9245BB66');
});

tsts.run();
