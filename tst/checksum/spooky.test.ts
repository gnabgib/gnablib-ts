import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Spooky } from '../../src/checksum';
import { U64 } from '../../src/primitive/number';

const tsts = suite('Spooky');

const fox=utf8.toBytes('The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog');
const test:[Uint8Array,[U64,U64],string][]=[
    [
        utf8.toBytes('a'),
        [U64.zero,U64.zero],
        "1A108191A0BBC9BD754258F061412A92"
    ],
    //wikipedia: 219 bytes
    [
        fox,
        [U64.zero,U64.zero],
        "F1B71C6AC5AF39E7B69363A60DD29C49"
    ],
    [
        new Uint8Array(0),
        [U64.fromInt(1),U64.zero],
        '0D6ADB776D017E08E0AC00827873FA3D'
    ],
    [
        fox,
        [U64.fromInt(1),U64.zero],
        '5D8F2D77F7DB556F262BB3771A0E70AF'
    ],
];
let count=0;
for (const [data,seed,expect] of test) {
    tsts(`Spooky[${count++}]`,()=>{
		const hash=new Spooky(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}


tsts(`reset`,()=>{
    const h=new Spooky(U64.fromInt(1));
    const sumEmpty='0D6ADB776D017E08E0AC00827873FA3D';
    const sumFox='5D8F2D77F7DB556F262BB3771A0E70AF';
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
    h.write(fox);
    assert.is(hex.fromBytes(h.sum()),sumFox);
    h.reset();
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
});

tsts(`newEmpty`,()=>{
    const h=new Spooky(U64.fromInt(1));
    const sumEmpty='0D6ADB776D017E08E0AC00827873FA3D';
    const sumFox='5D8F2D77F7DB556F262BB3771A0E70AF';

    assert.is(hex.fromBytes(h.sum()),sumEmpty);

    h.write(fox);
    assert.is(hex.fromBytes(h.sum()),sumFox);
    assert.is(hex.fromBytes(h.sum()),sumFox,'double sum doesn\'t mutate');

    const h2=h.newEmpty();
    assert.is(hex.fromBytes(h2.sum()),sumEmpty);

});

tsts(`sumIn`,()=>{
    const h=new Spooky(U64.fromInt(1));
    h.write(Uint8Array.of(1));
    assert.is(hex.fromBytes(h.sum()),'83338970848071B904F5D3E8DC066A5A');
    //No change (although it mutated internal)
    assert.is(hex.fromBytes(h.sumIn()),'83338970848071B904F5D3E8DC066A5A');
    //Change because of previous SumIn
    assert.is(hex.fromBytes(h.sumIn()),'9C960CF81E5BACA432253BB02BFDA57A');
});

tsts(`clone`,()=>{
    const h=new Spooky(U64.fromInt(1));
    const sumEmpty='0D6ADB776D017E08E0AC00827873FA3D';
    const sumFox='5D8F2D77F7DB556F262BB3771A0E70AF';

    h.write(fox);
    assert.is(hex.fromBytes(h.sum()),sumFox);
    const h2=h.clone();
    assert.is(hex.fromBytes(h2.sum()),sumFox);
    h.reset();
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
    assert.is(hex.fromBytes(h2.sum()),sumFox);
});

tsts(`double-long`,()=>{
    //Once we've turned Spooky into long, further rights are more expedient
    const h=new Spooky(U64.fromInt(1));
    h.write(fox);
    h.write(fox);
    assert.is(hex.fromBytes(h.sumIn()),'BA977C991ABD02AC8CB35BAA8565F4F8')
});

tsts.run();