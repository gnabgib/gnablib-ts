import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { SpookyShort } from '../../src/checksum/Spooky';
import { U64 } from '../../src/primitive/number/U64';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('SpookyShort');

const sum_abcd = '5C6DB4E0725121B4ED4D2A6BF05F6D02';
const sum_abcdefgh = '101C8730A539EB6EA8F6B7FCF2CDF12E';

// prettier-ignore
const string_tests: [string, string][] = [
	['', '232706FC6BF509198B72EE65B4E851C7'],
	['a', '1A108191A0BBC9BD754258F061412A92'],
	['ab', 'F9DBB6AD202A090F9C7059B0DAD5AE93'],
	['abc', '8AAB15F77537C967C61367F8CA7811B0'],
	['abcd', sum_abcd],
	['abcdefg', 'E134FB62C64BA57E82370D1A277E05E1'],
	['abcdefgh', sum_abcdefgh],
	['message digest', 'A087095CA5C2309692A1679D4F4344DB'],
	['hello', '3768826AD382E6CA5C941ED1C71AE043'],
	['hello, world', '1DC684B1EE36B01D3193D5870F9BD24A'],
	['1234567891123456', 'CF70CA9B6019ECE857D5EDD9787BE86C'],
	['12345678911234567', 'DC93885C980E2E4E6FF3BD49596D734B'],
	['123456789112345678921234', 'A742D316339B7585E098B060ED1FD841'],
	['1234567891123456789212345678931', '9950C85ABC8A125410653913D7790DDC'],
	['12345678911234567892123456789312', '140BBE628104B717DE3431E0FB001E09'],
	['123456789112345678921234567893123', 'E60A9A85836FCD9D0A93B1019E53E1E2'],
	['1234567891123456789212345678931234567894', '750D7D05851AE27A9589D27963AA7D8A'],
	['123456789112345678921234567893123456789412345678', 'BAD6ACCE2828AD15A4E8F318239B80ED'],
	['1234567891123456789212345678931234567894123456789', '7BF23BC093BFBEC1E22F14A751AF3757'],
	['1234567891123456789212345678931234567894123456789512345678961234', '02D17C823DB8047222E239B472E2D2EA'],
	['12345678911234567892123456789312345678941234567895123456789612345', '518208C91AB28F50B00550D66079E2C0'],
	//wikipedia: 43 bytes
	['The quick brown fox jumps over the lazy dog', '2B12E846AA0693C71D367E742407341B'],
];
for (const [src, expect] of string_tests) {
	tsts(`SpookyShort(${src})`, () => {
		const hash = new SpookyShort();
		hash.write(utf8.toBytes(src));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const altSeed: [U64, U64] = [U64.fromInt(1), U64.zero];
const alt_seed_tests: [Uint8Array, string][] = [
	[new Uint8Array(0), '0D6ADB776D017E08E0AC00827873FA3D'],
];

for (const [data, expect] of alt_seed_tests) {
	tsts(`SpookyShort([${data.length}],altSeed)`, () => {
		const hash = new SpookyShort(...altSeed);
		hash.write(data);
		const md = hash.sumIn();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new SpookyShort();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), 'BDD0DC528D4B78887E20C6D221EB6BE0');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new SpookyShort();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
