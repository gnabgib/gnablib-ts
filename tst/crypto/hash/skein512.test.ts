import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Skein512 } from '../../../src/crypto/hash/Skein';

const tsts = suite('Skein512');

const test_bytes: [string, string][] = [
	//https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf (Appendix C)
	[
		'FF',

		'71B7BCE6FE6452227B9CED6014249E5BF9A9754C3AD618CCC4E0AAE16B316CC8' +
			'CA698D864307ED3E80B6EF1570812AC5272DC409B5A012DF2A579102F340617A',
	],
	[
		'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0' +
			'DFDEDDDCDBDAD9D8D7D6D5D4D3D2D1D0CFCECDCCCBCAC9C8C7C6C5C4C3C2C1C0',

		'45863BA3BE0C4DFC27E75D358496F4AC9A736A505D9313B42B2F5EADA79FC17F' +
			'63861E947AFB1D056AA199575AD3F8C9A3CC1780B5E5FA4CAE050E989876625B',
	],
	[
		'FFFEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EFEEEDECEBEAE9E8E7E6E5E4E3E2E1E0' +
			'DFDEDDDCDBDAD9D8D7D6D5D4D3D2D1D0CFCECDCCCBCAC9C8C7C6C5C4C3C2C1C0' +
			'BFBEBDBCBBBAB9B8B7B6B5B4B3B2B1B0AFAEADACABAAA9A8A7A6A5A4A3A2A1A0' +
			'9F9E9D9C9B9A999897969594939291908F8E8D8C8B8A89888786858483828180',

		'91CCA510C263C4DDD010530A33073309628631F308747E1BCBAA90E451CAB92E' +
			'5188087AF4188773A332303E6667A7A210856F742139000071F48E8BA2A5ADB7',
	],
	//github.com/aead/skein/
	[
		'',

		'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A',
	],
    [
        'D3090C72',

        '1259AFC2CB025EEF2F681E128F889BBCE57F9A502D57D1A17239A12E71603559'+
        '16B72223790FD9A8B367EC96212A3ED239331ED72EF3DEB17685A8D5FD75158D'
    ],

	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB',

		'02D01535C2DF280FDE92146DF054B0609273C73056C93B94B82F5E7DCC5BE697' +
			'9978C4BE24331CAA85D892D2E710C6C9B4904CD056A53547B866BEE097C0FB17',
	],
];
for (const [source, expect] of test_bytes) {
	tsts(`Skein-512-512(x${source})`, () => {
		const hash = new Skein512();
		hash.write(hex.toBytes(source));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const test_string:[string,number,string][]=[
    //https://en.wikipedia.org/wiki/Skein_%28hash_function%29
    [
        "The quick brown fox jumps over the lazy dog",

        32,

        'B3250457E05D3060B1A4BBC1428BC75A3F525CA389AEAB96CFA34638D96E492A'
    ],
    [
        "The quick brown fox jumps over the lazy dog.",

        32,

        '41E829D7FCA71C7D7154ED8FC8A069F274DD664AE0ED29D365D919F4E575EEBB'
    ],
    [
        "The quick brown fox jumps over the lazy dog",

        64,

        '94C2AE036DBA8783D0B3F7D6CC111FF810702F5C77707999BE7E1C9486FF238A'+
        '7044DE734293147359B4AC7E1D09CD247C351D69826B78DCDDD951F0EF912713'
    ],
    [
        "The quick brown fox jumps over the lazy dog.",

        64,

        '658223CB3D69B5E76E3588CA63FEFFBA0DC2EAD38A95D0650564F2A39DA8E83F'+
        'BB42C9D6AD9E03FBFDE8A25A880357D457DBD6F74CBCB5E728979577DBCE5436'
    ],
];
for (const [source, number,expect] of test_string) {
	tsts(`Skein-512-${number}B(${source})`, () => {
		const hash = new Skein512(number);
		hash.write(utf8.toBytes(source));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const test_size: [string, number, string][] = [
	// https://en.wikipedia.org/wiki/Skein_%28hash_function%29
	[
        '', 

        32, 

        '39CCC4554A8B31853B9DE7A1FE638A24CCE6B35A55F2431009E18780335D2621'],
	[
		'',

		64,

		'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A',
	],

	//github.com/aead/skein
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		20,

		'EF03079D61B57C6047E15FA2B35B46FA24279539',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		32,

		'809DD3F763A11AF90912BBB92BC0D94361CBADAB10142992000C88B4CEB88648',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		48,

		'825F5CBD5DA8807A7B4D3E7BD9CD089CA3A256BCC064CD73A9355BF3AE67F2BF' +
			'93AC7074B3B19907A0665BA3A878B262',
	],
	[
		'FBD17C26B61A82E12E125F0D459B96C91AB4837DFF22B39B78439430CDFC5DC8' +
			'78BB393A1A5F79BEF30995A85A12923339BA8AB7D8FC6DC5FEC6F4ED22C122BB' +
			'E7EB61981892966DE5CEF576F71FC7A80D14DAB2D0C03940B95B9FB3A727C66A' +
			'6E1FF0DC311B9AA21A3054484802154C1826C2A27A0914152AEB76F1168D4410',

		64,

		'1A0D5ABF4432E7C612D658F8DCFA35B0D1AB68B8D6BD4DD115C23CC57B5C5BCD' +
			'DE9BFF0ECE4208596E499F211BC07594D0CB6F3C12B0E110174B2A9B4B2CB6A9',
	],
];
for (const [source, size, expect] of test_size) {
	tsts(`Skein-512-${size}Ƃ(x${source})`, () => {
		const hash = new Skein512(size);
		hash.write(hex.toBytes(source));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`reset`, () => {
	const hash = new Skein512();
	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A'
	);
	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A'
	);

	hash.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'71B7BCE6FE6452227B9CED6014249E5BF9A9754C3AD618CCC4E0AAE16B316CC8' +
			'CA698D864307ED3E80B6EF1570812AC5272DC409B5A012DF2A579102F340617A',
		'first sum'
	);
	hash.reset();

	hash.write(hex.toBytes(''));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A'
	);
});

tsts(`newEmpty`, () => {
	const hash = new Skein512();
	hash.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash.sum()),
		'71B7BCE6FE6452227B9CED6014249E5BF9A9754C3AD618CCC4E0AAE16B316CC8' +
			'CA698D864307ED3E80B6EF1570812AC5272DC409B5A012DF2A579102F340617A'
	);
	const hash2 = hash.newEmpty();
	hash2.write(hex.toBytes('FF'));
	assert.equal(
		hex.fromBytes(hash2.sum()),
		'71B7BCE6FE6452227B9CED6014249E5BF9A9754C3AD618CCC4E0AAE16B316CC8' +
			'CA698D864307ED3E80B6EF1570812AC5272DC409B5A012DF2A579102F340617A'
	);
});

const zeroBytes=new Uint8Array(0);
tsts(`New128`,()=>{
    const hash=Skein512.New128();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        '7C9AFF5C3738E3FAADC7A5265768DEF1'
    );
})

tsts(`New160`,()=>{
    const hash=Skein512.New160();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        '49DAF1CCEBB3544BC93CB5019BA91B0EEA8876EE'
    );
})

tsts(`New224`,()=>{
    const hash=Skein512.New224();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        '1541AE9FC3EBE24EB758CCB1FD60C2C31A9EBFE65B220086E7819E25'
    );
})

tsts(`New256`,()=>{
    const hash=Skein512.New256();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        '39CCC4554A8B31853B9DE7A1FE638A24CCE6B35A55F2431009E18780335D2621'
    );
})

tsts(`New384`,()=>{
    const hash=Skein512.New384();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        'DD5AAF4589DC227BD1EB7BC68771F5BAEAA3586EF6C7680167A023EC8CE26980'+
        'F06C4082C488B4AC9EF313F8CBE70808'
    );
})

tsts(`New512`,()=>{
    const hash=Skein512.New512();
    hash.write(zeroBytes);
    assert.equal(
        hex.fromBytes(hash.sum()),
        'BC5B4C50925519C290CC634277AE3D6257212395CBA733BBAD37A4AF0FA06AF4' +
			'1FCA7903D06564FEA7A2D3730DBDB80C1F85562DFCC070334EA4D1D9E72CBA7A'
    );
})
tsts.run();
