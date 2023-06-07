import { suite } from 'uvu';
import {Assert} from '../../src/test/assert';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import { Md4 } from '../../src/hash/Md4';

const tsts = suite('MD4/RFC 1320');
//Note RFC 6150 retires

const asciiHexPairs = [
	//Source: https://datatracker.ietf.org/doc/html/rfc1186
	['', '31D6CFE0D16AE931B73C59D7E0C089C0'],
	['a', 'BDE52CB31DE33E46245E05FBDBD6FB24'],
	['abc', 'A448017AAF21D8525FC10AE87AA6729D'],
	['message digest', 'D9130A8164549FE818874806E1C7014B'],
	['abcdefghijklmnopqrstuvwxyz', 'D79E1C308AA5BBCDEEA8ED63DF412DA9'],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'043F8582F241DB351CE627E153E7F0E4',
	],
	['hi', 'CFAEE2512BD25EB033236F0CD054E308'],

	//Source: https://en.wikipedia.org/wiki/MD4
	['\0', '47C61A0FA8738BA77308A8A600F88E4B'],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'E33B4DDC9C38F2199C3E7B164FCC0536',
	],
	//https://md5calc.com/hash/md4
	['ABCDEFGHIJKLMNOPQRSTUVWXYZ', '33A5FCA8C278DD69EE6B3CA82C23A21D'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZa', '1A5BCDD59B933BD2187532E268D246FE'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZab', '4990B3D0936D92DB84BD78FC4CA3BE11'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabc', 'DBD30506823F9DE3C853FE7AC6B700B5'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcd', 'A675BF369FF068F0C262BB54BB454D1E'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcde', 'D3C35FE85B8559E495A21BEBEBFD0300'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef', '390804D8458CF1C8F10CF20EDA53650A'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg', '61FC4A51B0678F3E18C8B79D1AC211A7'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh', '19D58B7F2CB297318DF0A49E6FF62B36'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', '16CF9FB7A8F028B4C841C6507F691BD7'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij', '41A3840F5722E7D21CEC6F8086D12B8F'],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk', 'CDE48A651095B8AC9AAF1100C1CB5899'],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl',
		'ACEDCA89C4A4A88B61D561EA9C415D86',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm',
		'DC4A17F1366571B0382B36E88CCB7C60',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn',
		'49A7D50E1798A6E8E3E9DD31EAF57B7C',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno',
		'2E490BF4F18A2063F217845B6B34B118',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop',
		'3C380145D538D594E67E8908DD944E77',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
		'514BDF6FCA5D41EB97AC7778D331343F',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqr',
		'7AAE6D26F0A72A6F83E74C0C1543C75E',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrs',
		'4949957502D4DB4AAE1E27BB285EBB79',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrst',
		'B1365655035B235559DA56F2A900F3DA',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstu',
		'27704EEB0AFC4297CB311661393AF955',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv',
		'782CD0E5A6BD5A83A7E7CDAFD1204F2D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvw',
		'5923FA692CA3903A10FD622794850B8F',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx',
		'D65A6D68D7E3AA92DB96C6DA86B8BD60',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy',
		'86AF2E344AD669E2A317163E69F4D753',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'1B2EEE05202921A141CCAA71D7017030',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'4FD3E033EFDAA1F118773F4261820FAE',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'0FC6AD506A3E6D7513D05DA753575E59',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'14FDF2056BF88B3491C385D8AC4F48E6',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'DB837DBB6098A50A2D3974BC1CC76133',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'0D61C8A56544B369ABF6F210B4278794',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345',
		'0C8AFA905333AEBA90E300484E14D4A1',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'9F13932C1C9B927B466B24C73F5914D8',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'4A3A4EC27F367A0660DD17AAC3C6C9C2',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'0CD54BB50EE67541CF394FD346E1E2DE',
	],
	['f', '1B08AF276DBC7593271F4EE616289324'],
	['fo', '0EE163FAA9CD3DBBC407AE16119499DB'],
	['foo', '0AC6700C491D70FB8650940B1CA1E4B2'],
	['foob', '34F4A64306732BB30B54EC58076D9D2A'],
	['fooba', 'D6C27B6FBF6C421D8FFFDC9D995B535A'],
	['foobar', '547AEFD231DCBAAC398625718336F143'],
	['foo bar baz٪☃🍣', 'CF18BF7E006E81D79F6285CA12D552F9'],
	['gnabgib', '2AA4B585F046299C9A5F348DC6D3846A'],
];

for (const [source,expect] of asciiHexPairs) {
	tsts('md4:' + source, () => {
		const b = utf8.toBytes(source);
		const hash=new Md4();
		hash.write(b);
		const md=hash.sum();
		Assert.bytesMatchHex(md, expect);
	});
}

tsts('Sequential Hash: a/ab/b',()=> {
	const hash=new Md4();
	//md(a)
	hash.write(utf8.toBytes('a'));
	Assert.bytesMatchHex(hash.sum(), 'BDE52CB31DE33E46245E05FBDBD6FB24');
	//md(ab)
	hash.write(utf8.toBytes('b'));
	Assert.bytesMatchHex(hash.sum(), 'EC388DD78999DFC7CF4632465693B6BF');
	//md(b)
	hash.reset();
	hash.write(utf8.toBytes('b'));
	Assert.bytesMatchHex(hash.sum(), '7AEAFCB2818E533B384433DEA80992F5');
});

tsts('MD4 Collision example:',()=>{
	const k1='839c7a4d7a92cb56'+'78a5d5b9eea5a757'+'3c8a74deb366c3dc'+'20a083b69f5d2a3b'+
	//        --------------^-   ------^---------   ----------------   ----------------
			 'b3719dc69891e9f9'+'5e809fd7e8b23ba6'+'318edd45e51fe397'+'08bf9427e9c3e8b9';
	//        ----------------   ----------------   -----^----------   ----------------
	const k2='839c7a4d7a92cbd6'+'78a5d529eea5a757'+'3c8a74deb366c3dc'+'20a083b69f5d2a3b'+
	//        --------------^-   ------^---------   ----------------   ----------------
			 'b3719dc69891e9f9'+'5e809fd7e8b23ba6'+'318edc45e51fe397'+'08bf9427e9c3e8b9';
	//        ----------------   ----------------   -----^----------   ----------------

	assert.not.equal(k1,k2);

	const hash=new Md4();
	hash.write(Hex.toBytes(k1));
	const digest1=hash.sum();
	hash.reset();

	hash.write(Hex.toBytes(k2));
	const digest2=hash.sum();

	assert.is(Hex.fromBytes(digest1),Hex.fromBytes(digest2));
});


tsts.run();
