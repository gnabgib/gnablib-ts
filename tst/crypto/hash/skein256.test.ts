import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Skein256 } from '../../../src/crypto/hash/Skein';

const tsts = suite('Skein256');

const test_bytes: [string, string][] = [
	// https://en.wikipedia.org/wiki/Skein_%28hash_function%29
	[
        '', 
        
        'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'],
	//https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf
	[
        'FF', 
        
        '0B98DCD198EA0E50A7A244C444E25C23DA30C10FC9A1F270A6637F1F34E67ED2'],
	[
		'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0',

		'8D0FA4EF777FD759DFD4044E6F6A5AC3C774AEC943DCFC07927B723B5DBF408B',
	],
	[
		'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0' +
			'DFDEDDDCDBDAD9D8D7D6D5D4D3D2D1D0CFCECDCCCBCAC9C8C7C6C5C4C3C2C1C0',

		'DF28E916630D0B44C4A849DC9A02F07A07CB30F732318256B15D865AC4AE162F',
	],
    [
        'D3090C72167517F7C7AD82A70C2FD3F6443F608301591E59',

        'DCBD5C8BD09021A840B0EA4AAA2F06E67D7EEBE882B49DE6B74BDC56B60CC48F'
    ],
];
for (const [source, expect] of test_bytes) {
	tsts(`Skein-256-256(x${source})`, () => {
		const hash = new Skein256();
		hash.write(hex.toBytes(source));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const test_size: [string, number, string][] = [
	//github.com/aead/skein/skein256
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		20,

		'0CD491B7715704C3A15A45A1CA8D93F8F646D3A1',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		28,

		'AFD1E2D0F5B6CD4E1F8B3935FA2497D27EE97E72060ADAC099543487',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		32,

		'4DE6FE2BFDAA3717A4261030EF0E044CED9225D066354610842A24A3EAFD1DCF',
	],

];
for (const [source, size, expect] of test_size) {
	tsts(`Skein-256-${size}Ƃ(x${source})`, () => {
		const hash = new Skein256(size);
		hash.write(hex.toBytes(source));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`reset`, () => {
	const hash = new Skein256();
	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'
	);
	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'
	);
	hash.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'0B98DCD198EA0E50A7A244C444E25C23DA30C10FC9A1F270A6637F1F34E67ED2',
		'first sum'
	);
	hash.reset();

	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'
	);
});

tsts(`newEmpty`, () => {
	const hash = new Skein256();
	hash.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'0B98DCD198EA0E50A7A244C444E25C23DA30C10FC9A1F270A6637F1F34E67ED2'
	);
	const hash2 = hash.newEmpty();
	hash2.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash2.sum()),
		'0B98DCD198EA0E50A7A244C444E25C23DA30C10FC9A1F270A6637F1F34E67ED2'
	);
});

const zeroBytes=new Uint8Array(0);
tsts(`New128`,()=>{
    const hash=Skein256.New128();
    hash.write(zeroBytes);
	assert.equal(
		hex.fromBytes(hash.sum()),
		'07E8FF2191C5052E1A25914C7C213078'
	);
})

tsts(`New160`,()=>{
    const hash=Skein256.New160();
    hash.write(zeroBytes);
	assert.equal(
		hex.fromBytes(hash.sum()),
		'FF800BED6D2044EE9D604A674E3FDA50D9B24A72'
	);
})

tsts(`New224`,()=>{
    const hash=Skein256.New224();
    hash.write(zeroBytes);
	assert.equal(
		hex.fromBytes(hash.sum()),
		'0FADF1FA39E3837A95B3660B4184D9C2F3CFC94B55D8E7A083278BF8'
	);
})

tsts(`New256`,()=>{
    const hash=Skein256.New256();
    hash.write(zeroBytes);
	assert.equal(
		hex.fromBytes(hash.sum()),
		'C8877087DA56E072870DAA843F176E9453115929094C3A40C463A196C29BF7BA'
	);
})

tsts.run();
