import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { XxHash64 } from '../../src/hash/XxHash';
import * as utf8 from '../../src/encoding/Utf8';
import { U64 } from '../../src/primitive/U64';

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
];
let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`XxHash64[${count++}]`,()=>{
		const hash=new XxHash64(seed);
		hash.write(data);
        const md=hash.sum();
        assert.is(Hex.fromBytes(md),expect);
	});
}

tsts.run();