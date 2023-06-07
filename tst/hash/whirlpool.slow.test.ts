import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import { Whirlpool } from '../../src/hash/Whirlpool';

const tsts = suite('Whirlpool/ISO 10118-3:2004 - SLOW');

const a64_bytes=utf8.toBytes('a'.repeat(64));

tsts('Whirlpool: a.repeat(1000000)', () => {
    //~3s, 1.3s, 16s, 1s, .3s
    //console.profile();
    //const t0 = performance.now();
    const hash=new Whirlpool();
    //15625 * 64 = 1000000
	for(let i=0;i<15625;i++) hash.write(a64_bytes);
    const md=hash.sum();
	assert.is(Hex.fromBytes(md), '0C99005BEB57EFF50A7CF005560DDF5D29057FD86B20BFD62DECA0F1CCEA4AF51FC15490EDDC47AF32BB2B66C34FF9AD8C6008AD677F77126953B226E4ED8B01');
    //const t1 = performance.now();
    //console.log(`Whirlpool.hash(a(10^6)) took ${t1 - t0} milliseconds.`);
    //console.profileEnd();
});

tsts.run();
