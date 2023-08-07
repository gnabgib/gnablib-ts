import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Sha3_384 } from '../../../src/crypto';


const tsts = suite('SHA3/FIPS-202 (384)');

const ascii384Pairs = [
	//Source: https://en.wikipedia.org/wiki/SHA-2
	[
		'',
		'0C63A75B845E4F7D01107D852E4C2485C51A50AAAA94FC61995E71BBEE983A2AC3713831264ADB47FB6BD1E058D5F004',
	],
	//https://emn178.github.io/online-tools/sha3_384.html
	[
		'The quick brown fox jumps over the lazy dog',
		'7063465E08A93BCE31CD89D2E3CA8F602498696E253592ED26F07BF7E703CF328581E1471A7BA7AB119B1A9EBDF8BE41',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'1A34D81695B622DF178BC74DF7124FE12FAC0F64BA5250B78B99C1273D4B080168E10652894ECAD5F1F4D5B965437FB9',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'E414797403C7D01AB64B41E90DF4165D59B7F147E4292BA2DA336ACBA242FD651949EB1CFFF7E9012E134B40981842E1',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'3C213A17F514638ACB3BF17F109F3E24C16F9F14F085B52A2F2B81ADC0DB83DF1A58DB2CE013191B8BA72D8FAE7E2A5E',
	],
	[
		'gnabgib',
		'A203DAAC1700A77F12FAB155B20F29DF46C3F1C2F7B8C85703E8FFBD254D813AD8151564A506D9BC4CA14A477EAAA6AA',
	],
];

for (const [source,expect] of ascii384Pairs) {
	const b = utf8.toBytes(source);
	tsts('SHA3-384:' + source, () => {
		const hash=new Sha3_384();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,48);
		assert.is(hash.blockSize,832/8);
	});
}

tsts.run();
