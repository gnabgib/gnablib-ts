import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lookup2 } from '../../src/checksum';
import { hex, utf8 } from '../../src/codec';

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
    [utf8.toBytes('My hovercraft is full of eels.'),0,2243816318],//More than one hash
    [Uint8Array.of(0),1,1948748577],
    [Uint8Array.of(0,0),1,49118037],
];

let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`Lookup2[${count++}]`,()=>{
		const hash=new Lookup2(seed);
		hash.write(data);
        assert.is(hash.sum32(),expect);
	});
}

tsts(`sum()`,()=>{
    const hash=new Lookup2(0);
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'6DDFB8C9');
    assert.is(hex.fromBytes(hash.sum()),'6DDFB8C9','Sum doesn\'t mutate state');
});

tsts(`reset`,()=>{
    const hash=new Lookup2(1);
    hash.write(Uint8Array.of(0));
    assert.is(hash.sum32(),1948748577)
    hash.reset();
    hash.write(Uint8Array.of(0,0));
    assert.is(hash.sum32(),49118037);
})

tsts(`newEmpty`,()=>{
    const hash=new Lookup2(1);
    hash.write(Uint8Array.of(0,0));
    const hash2=hash.newEmpty();
    hash2.write(Uint8Array.of(0));
    assert.is(hash.sum32(),49118037,'first is 0,0');
    assert.is((hash2 as Lookup2).sum32(),1948748577,'second hash is 0, /w same seed');
})

tsts.run();