import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { SpookyShort } from '../../src/checksum';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('SpookyShort');

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

    [
        new Uint8Array(0),
        [U64.fromInt(1),U64.zero],
        '0D6ADB776D017E08E0AC00827873FA3D'
    ]
];

let count=0;
for (const [data,seed,expect] of testShort) {
    tsts(`SpookyShort[${count++}]`,()=>{
		const hash=new SpookyShort(seed[0],seed[1]);
		hash.write(data);
        const md=hash.sumIn();
        assert.is(hex.fromBytes(md),expect);
	});
}

tsts(`reset`,()=>{
    const h=new SpookyShort(U64.fromInt(1));
    const sumEmpty='0D6ADB776D017E08E0AC00827873FA3D';
    const sum123='2EE37123EF83D6F7222E09E98D2D926E';
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
    h.write(Uint8Array.of(1,2,3));
    assert.is(hex.fromBytes(h.sum()),sum123);
    h.reset();
    assert.is(hex.fromBytes(h.sum()),sumEmpty);
});

tsts(`newEmpty`,()=>{
    const h=new SpookyShort(U64.fromInt(1));
    const sumEmpty='0D6ADB776D017E08E0AC00827873FA3D';
    const sum123='2EE37123EF83D6F7222E09E98D2D926E';

    assert.is(hex.fromBytes(h.sum()),sumEmpty);

    h.write(Uint8Array.of(1,2,3));
    assert.is(hex.fromBytes(h.sum()),sum123);
    assert.is(hex.fromBytes(h.sum()),sum123,'double sum doesn\'t mutate');

    const h2=h.newEmpty();
    assert.is(hex.fromBytes(h2.sum()),sumEmpty);

});

tsts.run();