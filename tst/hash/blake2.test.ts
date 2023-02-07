import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { blake2b, blake2s } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693');

const ascii2sHexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	['', 28, '1FA1291E65248B37B3433475B2A0DD63D54A11ECC4E3E034E7BC1EF4'], //224
	['', 32, '69217A3079908094E11121D042354A7C1F55B6482CA1A51E1B250DFD1ED0EEF9'], //256
	//https://datatracker.ietf.org/doc/html/rfc7693#appendix-B
	[
		'abc',
		32,
		'508C5E8C327C14E2E1A72BA34EEB452F37458B209ED63A294D999B4C86675982',
	],
	//https://convertcase.net/
	//https://www.toolkitbay.com/tkb/tool/BLAKE2s_256
	[
		'The quick brown fox jumps over the lazy dog',
		32,
		'606BEEEC743CCBEFF6CBCDF5D5302AA855C256C29B88C8ED331EA1A6BF3C8812',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		32,
		'94662583A600A12DFF357C0A6F1B514A710EF0F587A38E8D2E4D7F67E9C81667',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		32,
		'AE8CE27C652988829D43A30E38A710E59C5ADACAB9076D8289D0F44976A567E8',
	],
	[
		'BLAKE',
		32,
		'A7A1DFCDA07405325EAE9B6B2C3FD77127D63657C63641EE30DE30E2C181AF79',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		32,
		'71D364433983776C6F5B9DD48DCA4CD902DC6EA8E903BF6C3789A86EB3C64B96',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congu',
		32,
		'5234BAEEBCD7C32FBFFE863C9391ACC7B3A77724B0CC2F8A7AF5EED9A61F38CE',
	],

	//https://github.com/dchest/blake2s/blob/master/blake2s_test.go
];

for (const pair of ascii2sHexPairs) {
	tsts('blake2s:' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		const hash = blake2s(b, pair[1] as number);
		assert.is(hex.fromBytes(hash), pair[2]);
	});
}

const ascii2bHexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	[
		'',
		48,
		'B32811423377F52D7862286EE1A72EE540524380FDA1724A6F25D7978C6FD3244A6CAF0498812673C5E05EF583825100',
	],
	[
		'',
		64,
		'786A02F742015903C6C6FD852552D272912F4740E15847618A86E217F71F5419D25E1031AFEE585313896444934EB04B903A685B1448B755D56F701AFE9BE2CE',
	],
	[
		'The quick brown fox jumps over the lazy dog',
		64,
		'A8ADD4BDDDFD93E4877D2746E62817B116364A1FA7BC148D95090BC7333B3673F82401CF7AA2E4CB1ECD90296E3F14CB5413F8ED77BE73045B13914CDCD6A918',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		64,
		'AB6B007747D8068C02E25A6008DB8A77C218D94F3B40D2291A7DC8A62090A744C082EA27AF01521A102E42F480A31E9844053F456B4B41E8AA78BBE5C12957BB',
	],
	//https://datatracker.ietf.org/doc/html/rfc7693#appendix-A
	[
		'abc',
		64,
		'BA80A53F981C4D0D6A2797B69F12F6E94C212F14685AC4B74B12BB6FDBFFA2D17D87C5392AAB792DC252D5DE4533CC9518D38AA8DBF1925AB92386EDD4009923',
	],
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_512
	[
		'The quick brown fox jumps over the lazy cog',
		64,
		'AF438EEA5D8CDB209336A7E85BF58090DC21B49D823F89A7D064C119F127BD361AF9C7D109EDDA0F0E91BDCE078D1D86B8E6F25727C98F6D3BB6F50ACB2DD376',
	],
	[
		'BLAKE',
		64,
		'7E8F13993FEC546049B1FEB33CB8A1D30C097D28C8DD1B3661B870794C29F016DE88CA56FF03F61E97C055F9F1C1CE0B8DED0A98880CE35D28D660777E96E983',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		64,
		'69DEDDB90547775205B78A7CCDD4671151ACB729006752B73F37C982D425DE8116CBA9272023F92A55BA2C3CD5A946C4A4D53E081EE66E2FD1D49B968FE83FF0',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mat',
		64,
		'383E814D941B92CC2B02425590C6E852156757594C059E070D48D54B4F5AEFDCDC039A1C9FA2A4047C0DE1ACC9EB50394F76221826B7B8E0E6EA3B29A5CFBD66',
	],
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_384
	[
		'The quick brown fox jumps over the lazy dog',
		48,
		'B7C81B228B6BD912930E8F0B5387989691C1CEE1E65AADE4DA3B86A3C9F678FC8018F6ED9E2906720C8D2A3AEDA9C03D',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		48,
		'927A1F297873CBE887A93B2183C4E2EBA53966BA92C6DB8B87029A1D8C673471D09740676CCED79C5016838973F630C3',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		48,
		'F5DF965BDBB28F443E522A303D4D1CE66AA7CE8635148D545A2A25C3B0F335E6EA30E7EB15C531EAE35F7C3D9056DDD1',
	],
	[
		'BLAKE',
		48,
		'573299FC9C5BA26892944E520F9C91E74173551CFF42707DBC1673D028468C9203DFE5E73157ACFD7D86F823CE40E9F7',
	],
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_256
	[
		'The quick brown fox jumps over the lazy dog',
		32,
		'01718CEC35CD3D796DD00020E0BFECB473AD23457D063B75EFF29C0FFA2E58A9',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		32,
		'036C13096926B3DFCCFE3F233BD1B2F583B818B8B15C01BE65AF69238E900B2C',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		32,
		'4F2ABD883017E2BFC5B56ABB87D5B19915AEE76A5E51BF1659B6853A2D3A3EBA',
	],
	[
		'BLAKE',
		32,
		'7C28CC8AD9601E556DBBF421C1B385FC7E7D34F1AE614899B21491B8C1F67B19',
	],
];
for (const pair of ascii2bHexPairs) {
	tsts(`blake2b ${pair[1]}: ${pair[0]}`, () => {
		const b = utf8.toBytes(pair[0] as string);
		const hash = blake2b(b, pair[1] as number);
		assert.is(hex.fromBytes(hash), pair[2]);
	});
}

tsts.run();
