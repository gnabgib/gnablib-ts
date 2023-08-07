import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Blake256 } from '../../../src/crypto';

const tsts = suite('Blake1-256');

/* Blake32/64 wre submitted with 10/14 rounds, but then tweaked in the SHA3 competition to 14/16 rounds
 *  which makes testing problematic.. The original test vectors can't be used for testing.
 * Helpfully the finally SHA3 submissions were renamed Blake256/512, but then Blake2(s|b) was released on
 *  top and Blake1 is hard to find (looks like the original website was taken down)
 */

const ascii256HexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	['', '716F6E863F744B9AC22C97EC7B76EA5F5908BC5B2F67C61510BFC4751384EA7A'],
	//Recalculated test vectors from Blake.pdf/Blake32 (14 rounds)
	['\0', '0CE8D4EF4DD7CD8D62DFDED9D4EDB0A774AE6A41929A74DA23109E8F11139C87'],
	[
		'\0'.repeat(72),
		'D419BAD32D504FB7D44D460C42C5593FE544FA4C135DEC31E21BD9ABDCC22D41',
	],
	//Newly calculated
	[
		'The quick brown fox jumps over the lazy cog',
		'6D1A80BD305F1DBE4FD65B319E5C753EC1C2E446D228690818D8A6DB7E3E43C8',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		'7DB614DBDB3C6B4E181DDA88D9FEE1B0325EB5594B50894108AE3528C00A87E0',
	],
	[
		'gnabgib',
		'8551389A6510BE491B969BC63115AAFAD99D0E9BD31FFA7155D95F4A305A2D2C',
	],
	//https://github.com/dchest/blake256/blob/master/blake256_test.go
	[
		'The quick brown fox jumps over the lazy dog',
		'7576698EE9CAD30173080678E5965916ADBB11CB5245D386BF1FFDA1CB26C9D7',
	],
	['BLAKE', '07663E00CF96FBC136CF7B1EE099C95346BA3920893D18CC8851F22EE2E36AA6'],
	[
		"'BLAKE wins SHA-3! Hooray!!!' (I have time machine)",
		'18A393B4E62B1887A2EDF79A5C5A5464DAF5BBB976F4007BEA16A73E4C1E198E',
	],
	[
		"HELP! I'm trapped in hash!",
		'1E75DB2A709081F853C2229B65FD1558540AA5E7BD17B04B9A4B31989EFFA711',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		'4181475CB0C22D58AE847E368E91B4669EA2D84BCD55DBF01FE24BAE6571DD08',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congu',
		'AF95FFFC7768821B1E08866A2F9F66916762BFC9D71C4ACB5FD515F31FD6785A',
	],
	//https://www.seanet.com/~bugbee/crypto/blake/blake_test.py
	[
		'\0'.repeat(55),
		'DC980544F4181CC43505318E317CDFD4334DAB81AE035A28818308867CE23060',
	],
	[
		'\0'.repeat(56),
		'26AE7C289EBB79C9F3AF2285023AB1037A9A6DB63F0D6B6C6BBD199AB1627508',
	],
	[
		'\0'.repeat(72),
		'D419BAD32D504FB7D44D460C42C5593FE544FA4C135DEC31E21BD9ABDCC22D41',
	],
];

for (const [source,expect] of ascii256HexPairs) {
	const b = utf8.toBytes(source);
	tsts('Blake256:' + source, () => {
		const hash=new Blake256();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
