import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lookup3 } from '../../src/checksum';
import { hex, utf8 } from '../../src/codec';

const tsts = suite('Lookup3');

const tests:[Uint8Array,[number,number],[number,number]][]=[
    [new Uint8Array(),[0,0],[ 3735928559, 3735928559 ]],
    [Uint8Array.of(0),[0,0],[ 2343125323, 1431942852 ]],
    [Uint8Array.of(0,0),[0,0],[ 1657627059, 301789417 ]],
    [Uint8Array.of(0,0,0),[0,0],[ 1808795151, 1150068427 ]],
    [Uint8Array.of(0,0,0,0),[0,0],[ 76781240, 2941345047 ]],
    [Uint8Array.of(1),[0,0],[ 82610235, 2126733405 ]],
    [utf8.toBytes('hello'),[0,0],[ 885767278, 1543812985 ]],
    [utf8.toBytes('hello, world'),[0,0],[ 1503810069, 3227379029  ]],//Exactly 12 bytes, just a finalize
    [utf8.toBytes('hello, world!'),[0,0],[ 2262714993, 1089227105,  ]],//Exactly 12 bytes (more than one hash)
    [utf8.toBytes('My hovercraft is full of eels.'),[0,0],[ 3977741523, 4239081275 ]],//More than one hash
];

let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`Lookup3[${count++}].sum32Pair()`,()=>{
		const hash=new Lookup3(...seed);
		hash.write(data);
        const md=hash.sum32pair();
        assert.equal(md,expect);
        // assert.is(md[0],expect[0],'md-0');
        // assert.is(md[1],expect[1],'md-1');
	});
    tsts(`Lookup3[${count++}].sum32()`,()=>{
		const hash=new Lookup3(...seed);
		hash.write(data);
        const md=hash.sum32();
        //sum32 just returns the first number of sum32pair
        assert.equal(md,expect[0]);
	});
}

tsts(`sum()`,()=>{
    const hash=new Lookup3(0);
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'C4B659554B41A98B');
    assert.is(hex.fromBytes(hash.sum()),'C4B659554B41A98B','Sum doesn\'t mutate state');
});

tsts(`reset`,()=>{
    const hash=new Lookup3(1);
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'E9F0FC11B361CD62')
    hash.reset();
    hash.write(Uint8Array.of(0,0));
    assert.is(hex.fromBytes(hash.sum()),'CBA68C440F06D06B');
})

tsts(`newEmpty`,()=>{
    const hash=new Lookup3(1);
    hash.write(Uint8Array.of(0,0));
    const hash2=hash.newEmpty();
    hash2.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'CBA68C440F06D06B','first is seed=1, w=0,0');
    assert.is(hex.fromBytes(hash2.sum()),'E9F0FC11B361CD62','second is seed=1, w=0');
})

tsts(`write twice throws`,()=>{
    const hash=new Lookup3(1);
    hash.write(Uint8Array.of(1,2,3));
    assert.throws(()=>hash.write(Uint8Array.of(4)));
})

tsts.run();