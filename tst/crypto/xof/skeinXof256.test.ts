import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinXof256 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinXOF 256');

const tests: [string, number, string][] = [
	// https://en.wikipedia.org/wiki/Skein_%28hash_function%29
	['', 32, 'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'],
	//github.com/aead/skein/skein256
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',
		48,
		'954620FB31E8B782A2794C6542827026FE069D715DF04261629FCBE81D7D529B' +
			'95BA021FA4239FB00AFAA75F5FD8E78B',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',
		64,
		'51347E27C7EABBA514959F899A6715EF6AD5CF01C23170590E6A8AF399470BF9' +
			'0EA7409960A708C1DBAA90E86389DF254ABC763639BB8CDF7FB663B29D9557C3',
	],
	//Other values
	['', 1, '34'],
	[
		'',

		64,

		'357728DE58A5F23315854840E0F2688D75376E7360030BBA4DBD7DA20306CD50' +
			'CC75E66DDB6B0AFD20BD0A7DACF88C8F421523F5315C0002388C39EC34EB4996',
	],
	[
		'',

		128,

		'5AED19E3DD3210A8EE30C7551E08866AA176D2814BFB607125304297CCD7E845' +
			'993090E785C51DA6D9AA6E295D0E869ABBC58978DAE405A8BB8BD5C9DDBF2010' +
			'DCBB4355C88A2A0E6C27234E4DCFBF0A318732843BB3CF8839E2EFCADB3D9646' +
			'1F452C0AAA8B32CEA7C3D6E03FED145C9BD6DED76C3FCB757777A36E245352F8',
	],
	[
		'',

		256,

		'31FD3AFBC8B5859290A3DEC0BAC30A166B61B036B56127ACB7EFF17A1F34BA1F' +
			'95CF3D6B6D399B2468438CF97CB571F04D80A79A66472B6942E31BF667BC1B4F' +
			'D21DEEC60F9E3DF0E3E7E53894F1FF5A2270A6F5E1E040915C010666F105E48F' +
			'43B3D58C60DEF86952ADFA8CD99815E3DA02E970DD1872BFB92CB3C760955C9E' +
			'8E86C3613CBCD61A84452FCB32F0740380AF49F73A40490A736F0FBB2682B6B9' +
			'6AC88DB746684011155149BA1737D58EB322BE1DBBE861C703E5D0FE5352F7FE' +
			'EFBD5D765F467DF4B8AFA4055D10861CF0AA476338CA3D31038986248A30FC0F' +
			'B00D92C33CB74769F61CBA540F8FEB98EFAD8A772ED2241B8BB12B06C3BB6243',
	],
];
for (const [source, size, expect] of tests) {
	tsts(`SkeinXOF256(${size}) x${source}`, () => {
		const xof = new SkeinXof256(size);
		xof.write(hex.toBytes(source));
		const md = xof.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
