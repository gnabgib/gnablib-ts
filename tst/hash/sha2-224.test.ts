import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import {
	Sha224,
} from '../../src/hash/Sha2';

const tsts = suite('SHA2/RFC 6234 | FIPS 180-4 (224)');

const ascii244Pairs = [
	//Source: RFC6234
	//test 1
	[
		'abc', 
		'23097D223405D8228642A477BDA255B32AADBCE4BDA0B3F7E36C9DA7'],
	//test 2
	[
		'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', 
		'75388B16512776CC5DBA5DA1FD890150B0C6455CB4F58B1952522525'],
	//test 4
	[
		'0123456701234567012345670123456701234567012345670123456701234567'.repeat(10), 
		'567F69F168CD7844E65259CE658FE7AADFA25216E68ECA0EB7AB8262'],

	//Source: https://en.wikipedia.org/wiki/SHA-2
	[
		'', 
		'D14A028C2A3A2BC9476102BB288234C415A2B01F828EA62AC5B3E42F'],
	[
		'The quick brown fox jumps over the lazy dog',
		'730E109BD7A8A32B1CB9D9A09AA2325D2430587DDBC0C38BAD911525',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'619CBA8E8E05826E9B8C519C0A5C68F4FB653E8A3D8AA04BB2C8CD4C',
	],
	//Source: https://md5calc.com/hash/sha224/
	[
		'The quick brown fox jumps over the lazy cog',
		'FEE755F44A55F20FB3362CDC3C493615B3CB574ED95CE610EE5B1E9B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'FB2B7C3A66B5F2A611AC6CA9B0043DB11A2C0B4C8DF6AFEA2FAC6CE9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'624F9D91CCDFDD8FF042D74044192ED73B5CB658B09F9CD96E4E984A',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'3F2FA9E0C21C10647C3EE834CCCD79F5580D1423B35FF44B24420BFD',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'A4619941EF6A62D83370E1081DAD2CF420E8B7E24FB8263F7035EEA2',
	],
	//Test the second block
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'39C1BDF3C0BDCC97BF0A8E0C99C909AB50191C0C3E99E3B0BF74F631',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'BAD325803FF15DD690CFE5FF76DA902893B9F0EFB0CC4391479F175C',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'D1F673D37803088BDD720124E600857292A707087482B17B816A75C0',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'86BF0E445831C0E64154CE884C21AB679576340421CBDEEB69D2DA04',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'F4DAB6DA745213E3B6AF34026E90DBD2D64228E3A739C3C6E56BD4B2',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'BFF72B4FCB7D75E5632900AC5F90D219E05E97A7BDE72E740DB393D9',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'B50AECBE4E9BB0B57BC5F3AE760A8E01DB24F203FB3CDCD13148046E',
	],
	['gnabgib', 'BAC996C38B530F7031B6B838AD4803970BDE1DFC567E5CF6D4CC7722'],
];
for (const [source,expect] of ascii244Pairs) {
	//continue;
	tsts('Sha224:' + source, () => {
		const b = utf8.toBytes(source);
		const hash=new Sha224();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const hex224Pairs=[
	//Test 6
	[
		'07', 
		'00ECD5F138422B8AD74C9799FD826C531BAD2FCABC7450BEE2AA8C2A'],
	//Test 8
	[
		'18804005dd4fbd1556299d6f9d93df62',
		'DF90D78AA78821C99B40BA4C966921ACCD8FFB1E98AC388E56191DB1'
	],
	//test 10
	[
		'55b210079c61b53add520622d1ac97d5cdbe8cb33aa0ae344517bee4d7ba09abc8533c5250887a43bebbac906c2e1837f26b36a59ae3be7814d506896b718b2a383ecdac16b96125553f416ff32c6674c74599a9005386d9ce1112245f48ee470d396c1ed63b92670ca56ec84deea814b6135eca54392bdedb9489bc9b875a8baf0dc1ae785736914ab7daa264bc079d269f2c0d7eddd810a426145a0776f67c878273',
		'0B31894EC8937AD9B91BDFBCBA294D9ADEFAA18E09305E9F20D5C3A4'],
];
for (const [source,expect] of hex224Pairs) {
	tsts('Sha224: 0x' + source, () => {
		const h = hex.toBytes(source);
		const hash=new Sha224();
		hash.write(h);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();