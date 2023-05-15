import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Whirlpool } from '../../src/hash/Whirlpool';

const tsts = suite('Whirlpool/ISO 10118-3:2004');
const asciiPairs = [
	//https://en.wikipedia.org/wiki/Whirlpool_(hash_function)
	[
		'',
		'19FA61D75522A4669B44E39C1D2E1726C530232130D407F89AFEE0964997F7A73E83BE698B288FEBCF88E3E03C4F0757EA8964E59B63D93708B138CC42A66EB3',
	],
	[
		'The quick brown fox jumps over the lazy dog',
		'B97DE512E91E3828B40D2B0FDCE9CEB3C4A71F9BEA8D88E75C4FA854DF36725FD2B52EB6544EDCACD6F8BEDDFEA403CB55AE31F03AD62A5EF54E42EE82C3FB35',
	],
	[
		'The quick brown fox jumps over the lazy eog',
		'C27BA124205F72E6847F3E19834F925CC666D0974167AF915BB462420ED40CC50900D85A1F923219D832357750492D5C143011A76988344C2635E69D06F2D38C',
	],

	//ISO test vectors
	[
		'a',
		'8ACA2602792AEC6F11A67206531FB7D7F0DFF59413145E6973C45001D0087B42D11BC645413AEFF63A42391A39145A591A92200D560195E53B478584FDAE231A',
	],
	[
		'abc',
		'4E2448A4C6F486BB16B6562C73B4020BF3043E3A731BCE721AE1B303D97E6D4C7181EEBDB6C57E277D0E34957114CBD6C797FC9D95D8B582D225292076D4EEF5',
	],
	[
		'message digest',
		'378C84A4126E2DC6E56DCC7458377AAC838D00032230F53CE1F5700C0FFB4D3B8421557659EF55C106B4B52AC5A4AAA692ED920052838F3362E86DBD37A8903E',
	],
	[
		'abcdefghijklmnopqrstuvwxyz',
		'F1D754662636FFE92C82EBB9212A484A8D38631EAD4238F5442EE13B8054E41B08BF2A9251C30B6A0B8AAE86177AB4A6F68F673E7207865D5D9819A3DBA4EB3B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'DC37E008CF9EE69BF11F00ED9ABA26901DD7C28CDEC066CC6AF42E40F82F3A1E08EBA26629129D8FB7CB57211B9281A65517CC879D7B962142C65F5A7AF01467',
	],
	[
		'abcdbcdecdefdefgefghfghighijhijk',
		'2A987EA40F917061F5D6F0A0E4644F488A7A5A52DEEE656207C562F988E95C6916BDC8031BC5BE1B7B947639FE050B56939BAAA0ADFF9AE6745B7B181C3BE3FD',
	],
	[
		'1234567890'.repeat(8),
		'466EF18BABB0154D25B9D38A6414F5C08784372BCCB204D6549C4AFADB6014294D5BD8DF2A6C44E538CD047B2681A51A2C60481E88C5A20B2C2A80CF3A9A083B',
	],

	//https://md5calc.com/hash/whirlpool/
	[
		'ab',
		'33E24E6CBEBF168016942DF8A7174048F9CEBC45CBD829C3B94B401A498ACB11C5ABCCA7F2A1238AAF534371E87A4E4B19758965D5A35A7CAD87CF5517043D97',
	],
	[
		'gnabgib',
		'4EF1524D24ADA9EE9A06975901F1C313A95565FE27E24D154840ECEA914F110709021A09ABDB09823F58A373B4C72E8598D098D4364B11CACA09622E1FC3FF42',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890',
		'3AA2C9CDA118888E16057EBA24683E15A6C24ADBE354C9FE3F6EA6DD340F2F35A85900E91E786CDF38EA20D09AD22E4F36394AA335D646A7B6E6668BBB06907B',
	],
	//Second block length: (fails)
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678901',
		'D82792D1C8A0FA4A5416BAC8B9936FC71AB839C31B9F6D6764746342E568EC0FDBD5FEF6CB928D3B9291D85C0876BF9089F9ACDFAF4D2CACEEF7478FD10ABF0B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789012',
		'44BCBD91A7A355D27364C92CE831FBDF42BF696B18B1E166D4956C6C3B416D334663D9817381A878987BE83403891AA55320DFF97EDDBC15558CA8DF1B181F02',
	],

	//https://md5hashing.net/hash/whirlpool
	[
		'password',
		'74DFC2B27ACFA364DA55F93A5CAEE29CCAD3557247EDA238831B3E9BD931B01D77FE994E4F12B9D4CFA92A124461D2065197D8CF7F33FC88566DA2DB2A4D6EAE',
	],
];

for (const [source,expect] of asciiPairs) {
	tsts('Whirlpool:' + source, () => {
		const b = utf8.toBytes(source);
		const hash=new Whirlpool();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
