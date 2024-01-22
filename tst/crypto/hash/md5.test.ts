import { suite } from 'uvu';
import {Assert} from '../../../src/test/assert';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Md5 } from '../../../src/crypto/hash';

const tsts = suite('MD5/RFC 1321');

const asciiHexPairs = [
	//Source: RFC 1321
	['', 'D41D8CD98F00B204E9800998ECF8427E'],
	['a', '0CC175B9C0F1B6A831C399E269772661'],
	['abc', '900150983CD24FB0D6963F7D28E17F72'],
	['message digest', 'F96B697D7CB7938D525A2F31AAF161D0'],
	['abcdefghijklmnopqrstuvwxyz', 'C3FCD3D76192E4007DFB496CCA67E13B'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789','D174AB98D277D9F5A5611C2C9F419D9F'],
	['12345678901234567890123456789012345678901234567890123456789012345678901234567890','57EDF4A22BE3C955AC49DA2E2107B67A'],


	//Source, MD5-as-hex
	['\0', '93B885ADFE0DA089CDF634904FD59F71'],
	['\0\0', 'C4103F122D27677C9DB144CAE1394A66'],
	['f', '8FA14CDD754F91CC6554C9E71929CCE7'],
	[
		'The quick brown fox jumps over the lazy dog',
		'9E107D9D372BB6826BD81D3542A419D6',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'E4D909C290D0FB1CA068FFADDF22CBD0',
	],
	//https://md5calc.com/hash/md5
	['ABCDEFGHIJKLMNOPQRSTUVWXYZ', '437BBA8E0BF58337674F4539E75186AC'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZa', 'FF5430F5934BE6AFD893DD7DC7DF4694'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZab', '38B26FADF19F786CD53F8A552A7836A8'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabc', 'A75D2DCA84FD828C29077E7A1F4C1157'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcd', 'BA3F00FDFCC2687D76889C621FBC4DE6'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcde', '00CCCC748563182A87BBC58F6D1036DC'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef', 'BC4EF011BF8FD545FC598CD2E4E4E90D'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg', 'E9AEAE8E2D227F87DBD3E8EB40FAC468'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh', '849C90C8D5310664E1E8269734B0449F'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', 'A864F6E686222631D74D9D046F756BDD'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij', '6BE76C03740FC34BB79B676DB8B033E1'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk', '3FF4B947893CF7B685B842F5670804C6'],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl',
		'652F89CCD746D3A2EB0B6A4726F72A8D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm',
		'D60367BDF543D4316496A5AFB3891FD9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn',
		'F2C8E0A199222B80D3076EE960857F37',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno',
		'F9FC290D4AD97443EB6614F1673C23EB',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
		'A1F93A6728A2301D54C54A4EC8FA0BCA',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
		'23D1D24706A4C3E8861B1C96C98B42C5',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqr',
		'08CF370659CC7F26871B2E8B8C3BD815',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrs',
		'D92CE2106CD38F38F08A7C6BCF0F2D2D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrst',
		'D9C6E6127819BA232B06E29BCCC54946',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstu',
		'013BC72286BBBF95BAB26BE64391C576',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv',
		'8CC62C74A83B77BBD7CB43D5EA80F86C',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvw',
		'C49FBF80C5620F75905D5A7CB0925F20',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx',
		'A28D800A8AB31547DCF23E2F570E2CE4',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy',
		'5970A27CC90C6838EBE4A67FDFCEC9C6',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'F29939A25EFABAEF3B87E2CBFE641315',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'89D3500925CDF8D50AF4D6B7B23635DF',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'E02E6847035B31D9EB171704FEE28EB7',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'B76972FE0DFF4BAAC395B531646F738E',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'27ECA74A76DAAE63F472B250B5BCFF9D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'7B704B4E3D241D250FD327D433C27250',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345',
		'BE82117F64F04440AC05AE910DC2E5C9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'6C78B6A01EF738AA2C115F6774E0D0A9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'02F67073E498486CF07DB121B1C06F9D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'BAC284BC4691EF939CDD215C16D0A47A',
	],
	['f', '8FA14CDD754F91CC6554C9E71929CCE7'],
	['fo', 'EED807024939B808083F0031A56E9872'],
	['foo', 'ACBD18DB4CC2F85CEDEF654FCCC4A4D8'],
	['foob', 'D0871A2B53C62DE5E046FEDE42F3F7AB'],
	['fooba', '73CF88A0B4A18C88A3996FA3D5B69A46'],
	['foobar', '3858F62230AC3C915F300C664312C63F'],
	['foo bar baz٪☃🍣', 'D7C4BA57383416CE758A11277E0E3D8E'],
	['gnabgib', '0DF80DBA66CE7E7B359FB87F21F88132'],
];

for (const [source,expect] of asciiHexPairs) {
	tsts('MD5:' + source, () => {
		const b = utf8.toBytes(source);
		const hash=new Md5();
		hash.write(b);
		const md=hash.sum();
		Assert.bytesMatchHex(md, expect);
	});
}

tsts('Sequential Hash: a/ab/b',()=> {
	const hash=new Md5();
	//md(a)
	hash.write(utf8.toBytes('a'));
	Assert.bytesMatchHex(hash.sum(), '0CC175B9C0F1B6A831C399E269772661');
	//md(ab)
	hash.write(utf8.toBytes('b'));
	Assert.bytesMatchHex(hash.sum(), '187EF4436122D1CC2F40DC2B92F0EBA0');
	//md(b)
	hash.reset();
	hash.write(utf8.toBytes('b'));
	Assert.bytesMatchHex(hash.sum(), '92EB5FFEE6AE2FEC3AD71C777531578F');
});

tsts('MD5 Collision example:',()=>{
	const k1='d131dd02c5e6eec4'+'693d9a0698aff95c'+'2fcab58712467eab'+'4004583eb8fb7f89'+
	//        ----------------   ----------------   ------^---------   ----------------
			 '55ad340609f4b302'+'83e488832571415a'+'085125e8f7cdc99f'+'d91dbdf280373c5b'+
	//        ----------------   ----------^-----   ----------------   ------^---------
			 'd8823e3156348f5b'+'ae6dacd436c919c6'+'dd53e2b487da03fd'+'02396306d248cda0'+
	//        ----------------   ----------------   ------^---------   ----------------
			 'e99f33420f577ee8'+'ce54b67080a80d1e'+'c69821bcb6a88393'+'96f9652b6ff72a70';
	//        ----------------   ----------^-----   ----------------   ------^---------

	const k2='d131dd02c5e6eec4'+'693d9a0698aff95c'+'2fcab50712467eab'+'4004583eb8fb7f89'+
	//        ----------------   ----------------   ------^---------   ----------------
			 '55ad340609f4b302'+'83e4888325f1415a'+'085125e8f7cdc99f'+'d91dbd7280373c5b'+
	//        ----------------   ----------^-----   ----------------   ------^---------
			 'd8823e3156348f5b'+'ae6dacd436c919c6'+'dd53e23487da03fd'+'02396306d248cda0'+
	//        ----------------   ----------------   ------^---------   ----------------
			 'e99f33420f577ee8'+'ce54b67080280d1e'+'c69821bcb6a88393'+'96f965ab6ff72a70';
	//        ----------------   ----------^-----   ----------------   ------^---------

	assert.not.equal(k1,k2);

	const hash=new Md5();
	hash.write(hex.toBytes(k1));
	const digest1=hash.sum();
	hash.reset();

	hash.write(hex.toBytes(k2));
	const digest2=hash.sum();

	assert.is(hex.fromBytes(digest1),hex.fromBytes(digest2));
});

tsts.run();