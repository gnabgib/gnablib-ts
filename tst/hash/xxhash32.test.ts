import { suite } from 'uvu';
import * as assert from 'uvu/assert';
//import * as hex from '../../src/encoding/Hex';
import { XxHash32 } from '../../src/hash/XxHash';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('XxHash32');

const tests:[Uint8Array,number,number][]=[
    [Uint8Array.of(0),0,0xCF65B03E],
    [utf8.toBytes('abc'),0,0x32D153FF],
    [utf8.toBytes('abcd'),0,0xA3643705],
    [utf8.toBytes('heiå'),0,0xDB5ABCCC],
    [utf8.toBytes('123456789112345'),0,0x674AE941],
    [utf8.toBytes('1234567891123456'),0,0xD71FE957],//temp block size
    [utf8.toBytes('12345678911234567'),0,0x333E44DF],//block+1
    [utf8.toBytes('12345678911234567892'),0,0x0EA19043],//block+4
    [utf8.toBytes('123456789112345678921'),0,0xD369D77D],//block+4+1

    //Seed!=0
    [utf8.toBytes('abc'),1,0xAA3DA8FF],
    [utf8.toBytes('abc'),0xCAFE,0xEF0FCA86],
];
let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`XxHash32[${count++}]`,()=>{
		const hash=new XxHash32(seed);
		hash.write(data);
        const md=hash.sum32();
        assert.is(md,expect);
	});
}

tsts.run();