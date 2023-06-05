import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { SpookyShort,SpookyLong,Spooky } from '../../src/hash/Spooky';
import * as utf8 from '../../src/encoding/Utf8';
import { U64 } from '../../src/primitive/U64';

const tsts = suite('Spooky');

const testShort:[Uint8Array,[U64,U64],string][]=[
    //1-15: C D _
    [utf8.toBytes('a'),[U64.zero,U64.zero],"1A108191A0BBC9BD754258F061412A92"],
    [utf8.toBytes('abdcdefg'),[U64.zero,U64.zero],"08A5CA707387A7EDD77409D3D5AA735B"],
    [utf8.toBytes('hello'),[U64.zero,U64.zero],"3768826AD382E6CA5C941ED1C71AE043"],
    [utf8.toBytes('hello, world'),[U64.zero,U64.zero],"1DC684B1EE36B01D3193D5870F9BD24A"],

    // 16/2: C D | c=sc d=sc _
    [utf8.toBytes('1234567891123456'),[U64.zero,U64.zero],"CF70CA9B6019ECE857D5EDD9787BE86C"],

    // 17-31: C D | C D _
    [utf8.toBytes('12345678911234567'),[U64.zero,U64.zero],"DC93885C980E2E4E6FF3BD49596D734B"],
    [utf8.toBytes('123456789112345678921234'),[U64.zero,U64.zero],"A742D316339B7585E098B060ED1FD841"],
    [utf8.toBytes('1234567891123456789212345678931'),[U64.zero,U64.zero],"9950C85ABC8A125410653913D7790DDC"],

    // 32/4: C D | A B c=sc d=sc _
    [utf8.toBytes('12345678911234567892123456789312'),[U64.zero,U64.zero],"140BBE628104B717DE3431E0FB001E09"],

    // 33-47: C D | A B C D _
    [utf8.toBytes('123456789112345678921234567893123'),[U64.zero,U64.zero],"E60A9A85836FCD9D0A93B1019E53E1E2"],
    [utf8.toBytes('1234567891123456789212345678931234567894'),[U64.zero,U64.zero],"750D7D05851AE27A9589D27963AA7D8A"],
    //wikipedia: 43 bytes
    [utf8.toBytes('The quick brown fox jumps over the lazy dog'),[U64.zero,U64.zero],"2B12E846AA0693C71D367E742407341B"],

    // 48/6: C D | A B C D | c=sc d=sc _
    [utf8.toBytes('123456789112345678921234567893123456789412345678'),[U64.zero,U64.zero],"BAD6ACCE2828AD15A4E8F318239B80ED"],

    // 49-63: C D | A B C D | C D _
    [utf8.toBytes('1234567891123456789212345678931234567894123456789'),[U64.zero,U64.zero],"7BF23BC093BFBEC1E22F14A751AF3757"],
    
    // 64/8: C D | A B C D | A B c=sc d=sc _
    [utf8.toBytes('1234567891123456789212345678931234567894123456789512345678961234'),[U64.zero,U64.zero],"02D17C823DB8047222E239B472E2D2EA"],

    [utf8.toBytes('12345678911234567892123456789312345678941234567895123456789612345'),[U64.zero,U64.zero],"518208C91AB28F50B00550D66079E2C0"],

    //wikipedia: 219 bytes
    // [utf8.toBytes('The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog'),
    // [U64.zero,U64.zero],"F1B71C6AC5AF39E7B69363A60DD29C49"],
];

let count=0;
for (const [data,seed,expect] of testShort) {
    tsts(`SpookyShort[${count++}]`,()=>{
		const hash=new SpookyShort(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}

const testLong:[Uint8Array,[U64,U64],string][]=[
    //wikipedia: 219 bytes
    [utf8.toBytes('The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog'),
    [U64.zero,U64.zero],"F1B71C6AC5AF39E7B69363A60DD29C49"],
    //200 chars > 192, should use long
    [utf8.toBytes('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'),
    [U64.zero,U64.zero],"242105FF3E9B7EC465CD7515C36B776B"]    
];
count=0;
for (const [data,seed,expect] of testLong) {
    tsts(`SpookyLong[${count++}]`,()=>{
		const hash=new SpookyLong(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}

const test:[Uint8Array,[U64,U64],string][]=[
    [utf8.toBytes('a'),[U64.zero,U64.zero],"1A108191A0BBC9BD754258F061412A92"],
    //wikipedia: 219 bytes
    [utf8.toBytes('The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog'),
    [U64.zero,U64.zero],"F1B71C6AC5AF39E7B69363A60DD29C49"],
];
count=0;
for (const [data,seed,expect] of test) {
    tsts(`Spooky[${count++}]`,()=>{
		const hash=new Spooky(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sum();
        assert.is(hex.fromBytes(md),expect);
	});
}

tsts.run();