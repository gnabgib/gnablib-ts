import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import { Blake2b_512 } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693 (b512)');

const ascii2bTests = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	[
		'',
		'786A02F742015903C6C6FD852552D272912F4740E15847618A86E217F71F5419D25E1031AFEE585313896444934EB04B903A685B1448B755D56F701AFE9BE2CE'
    ],
	[
		'The quick brown fox jumps over the lazy dog',
		'A8ADD4BDDDFD93E4877D2746E62817B116364A1FA7BC148D95090BC7333B3673F82401CF7AA2E4CB1ECD90296E3F14CB5413F8ED77BE73045B13914CDCD6A918'
    ],
	[
		'The quick brown fox jumps over the lazy dof',
		'AB6B007747D8068C02E25A6008DB8A77C218D94F3B40D2291A7DC8A62090A744C082EA27AF01521A102E42F480A31E9844053F456B4B41E8AA78BBE5C12957BB'
    ],
	//https://datatracker.ietf.org/doc/html/rfc7693#appendix-A
	[
		'abc',
		'BA80A53F981C4D0D6A2797B69F12F6E94C212F14685AC4B74B12BB6FDBFFA2D17D87C5392AAB792DC252D5DE4533CC9518D38AA8DBF1925AB92386EDD4009923'
    ],
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_512
	[
		'The quick brown fox jumps over the lazy cog',
		'AF438EEA5D8CDB209336A7E85BF58090DC21B49D823F89A7D064C119F127BD361AF9C7D109EDDA0F0E91BDCE078D1D86B8E6F25727C98F6D3BB6F50ACB2DD376',
    ],
	[
		'BLAKE',
		'7E8F13993FEC546049B1FEB33CB8A1D30C097D28C8DD1B3661B870794C29F016DE88CA56FF03F61E97C055F9F1C1CE0B8DED0A98880CE35D28D660777E96E983',
    ],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		'69DEDDB90547775205B78A7CCDD4671151ACB729006752B73F37C982D425DE8116CBA9272023F92A55BA2C3CD5A946C4A4D53E081EE66E2FD1D49B968FE83FF0',
    ],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mat',
		'383E814D941B92CC2B02425590C6E852156757594C059E070D48D54B4F5AEFDCDC039A1C9FA2A4047C0DE1ACC9EB50394F76221826B7B8E0E6EA3B29A5CFBD66',
    ],
];
for (const [source,expect] of ascii2bTests) {
	const b = utf8.toBytes(source);
	tsts(`Blake2b (${source}):`, () => {
		const hash=new Blake2b_512();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
