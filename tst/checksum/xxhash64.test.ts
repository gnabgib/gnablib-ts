import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XxHash64 } from '../../src/checksum';
import { hex, utf8 } from '../../src/codec';
import { U64 } from '../../src/primitive';

const tsts = suite('XxHash64');

const tests:[Uint8Array,U64,string][]=[
    [Uint8Array.of(0),U64.zero,'E934A84ADB052768'],
    [utf8.toBytes('abc'),U64.zero,'44BC2CF5AD770999'],
    [utf8.toBytes('abcd'),U64.zero,'DE0327B0D25D92CC'],
    [utf8.toBytes('heiå'),U64.zero,'B9D3D990D2001A1A'],
    [utf8.toBytes('123456789112345'),U64.zero,'3FE21A05D12D6937'],
    [utf8.toBytes('1234567891123456'),U64.zero,'2658B09CC412F64B'],
    [utf8.toBytes('12345678911234567'),U64.zero,'27EA21DEE5D4E44D'],
    [utf8.toBytes('12345678911234567892'),U64.zero,'40A3274A7CD71A84'],
    [utf8.toBytes('123456789112345678921'),U64.zero,'00556809F6F92F9F'],
    [utf8.toBytes('12345678911234567892123456789312'),U64.zero,'4D2BE36BEEC5C9B1'],//Block size
    [utf8.toBytes('123456789112345678921234567893123'),U64.zero,'9C9679E3CA2E9BAA'],//Block size+1
    [utf8.toBytes('123456789112345678921234567893123456'),U64.zero,'65EA0593C02478DE'],//Block size+4
    [utf8.toBytes('1234567891123456789212345678931234567'),U64.zero,'ACBD027696F9C7F6'],//Block size+4+!

    //Seed!=0
    [utf8.toBytes('abc'),U64.fromInt(1),'BEA9CA8199328908'],
    [utf8.toBytes('abc'),U64.fromInt(0xCAFE),'55650D94381E717A'],
    [Uint8Array.of(0),U64.fromInt(1),'771917C7F6EE2451'],
    [Uint8Array.of(0,0),U64.fromInt(1),'899FB35F8D5447F1'],
];
let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`XxHash64[${count++}]`,()=>{
		const hash=new XxHash64(seed);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}

tsts(`sum`,()=>{
    const hash=new XxHash64(U64.zero);
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'E934A84ADB052768');
});

tsts(`sumIn`,()=>{
    const hash=new XxHash64(U64.zero);
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sumIn()),'E934A84ADB052768');
});

tsts(`newEmpty`,()=>{
    const hash=new XxHash64(U64.fromInt(1));
    hash.write(Uint8Array.of(0,0));
    const hash2=hash.newEmpty();
    hash2.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'899FB35F8D5447F1','first is seed=1, w=0,0');
    assert.is(hex.fromBytes(hash2.sum()),'771917C7F6EE2451','second is seed=1, w=0');
});

tsts(`clone`,()=>{
    const hash=new XxHash64(U64.fromInt(1));
    hash.write(Uint8Array.of(0));
    const hash2=hash.clone();
    assert.is(hex.fromBytes(hash.sum()),'771917C7F6EE2451');
    assert.is(hex.fromBytes(hash2.sum()),'771917C7F6EE2451');
    
    hash.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(hash.sum()),'899FB35F8D5447F1');
    assert.is(hex.fromBytes(hash2.sum()),'771917C7F6EE2451');
});

tsts.run();