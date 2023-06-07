import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import { Blake2s_256 } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693 (s256)');

const ascii2sHexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	['', '69217A3079908094E11121D042354A7C1F55B6482CA1A51E1B250DFD1ED0EEF9'], //256
	//https://datatracker.ietf.org/doc/html/rfc7693#appendix-B
	[
		'abc',
		'508C5E8C327C14E2E1A72BA34EEB452F37458B209ED63A294D999B4C86675982',
	],
	//https://convertcase.net/
	//https://www.toolkitbay.com/tkb/tool/BLAKE2s_256
	[
		'The quick brown fox jumps over the lazy dog',
		'606BEEEC743CCBEFF6CBCDF5D5302AA855C256C29B88C8ED331EA1A6BF3C8812',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'94662583A600A12DFF357C0A6F1B514A710EF0F587A38E8D2E4D7F67E9C81667',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		'AE8CE27C652988829D43A30E38A710E59C5ADACAB9076D8289D0F44976A567E8',
	],
	[
		'BLAKE',
		'A7A1DFCDA07405325EAE9B6B2C3FD77127D63657C63641EE30DE30E2C181AF79',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		'71D364433983776C6F5B9DD48DCA4CD902DC6EA8E903BF6C3789A86EB3C64B96',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congu',
		'5234BAEEBCD7C32FBFFE863C9391ACC7B3A77724B0CC2F8A7AF5EED9A61F38CE',
	],

	//https://github.com/dchest/blake2s/blob/master/blake2s_test.go
];

for (const [source,expect] of ascii2sHexPairs) {
	const b = utf8.toBytes(source);
	tsts('Blake2s:' + source, () => {
        const hash=new Blake2s_256();
        hash.write(b);
		const md=hash.sum();
		assert.is(Hex.fromBytes(md), expect);
	});
}

tsts.run();
