import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { Lookup2 } from '../../src/hash/Lookup2';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('Lookup2');

const tests:[Uint8Array,number,number][]=[
    [new Uint8Array(),0,3175731469],
    [Uint8Array.of(0),0,1843378377],
    [Uint8Array.of(0,0),0,1948748577],
    [Uint8Array.of(0,0,0),0,49118037],
    [Uint8Array.of(0,0,0,0),0,2305145833],
    [Uint8Array.of(1),0,3107525544],
    [utf8.toBytes('hello'),0,3070638494],
    [utf8.toBytes('hello, world'),0,933292425],//Exactly 12 bytes (more than one hash)
    [utf8.toBytes('My hovercraft is full of eels.'),0,2243816318]//More than one hash
];

let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`Lookup2[${count++}]`,()=>{
		const hash=new Lookup2(seed);
		hash.write(data);
        assert.is(hash.sum32(),expect);
	});
}

tsts.run();