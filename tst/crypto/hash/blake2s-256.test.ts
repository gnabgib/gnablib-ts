import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Blake2s_256,Blake2s } from '../../../src/crypto/hash';
import { Uint64 } from '../../../src/primitive';
import { U64 } from '../../../src/primitive/number';

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
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`build`,()=>{
	//Just settings to show the diff
	const salt=Uint8Array.of(0,1,2,3,4,5,6,7);
	const pers=Uint8Array.of(0xf,0xe,0xd,0xc,0xb,0xa,9,8);
	const hash=new Blake2s(1,2,3,4,Uint64.fromNumber(5),6,7,undefined,salt,pers);
	assert.is(hash.size,1,'size');
	assert.is(hash.fanOut,2,'fanOut');
	assert.is(hash.maxDepth,3,'maxDepth');
	assert.is(hash.leafLen,4,'leafLen');
	assert.is(hash.nodeOffset.eq(U64.fromInt(5)),true,'nodeOffset');
	assert.is(hash.nodeDepth,6,'nodeDepth');
	assert.is(hash.innerLen,7,'innerLen');
	assert.is(hash.keyLen,0,'keyLen');

	assert.equal(hash.salt,salt,'salt');
	assert.equal(hash.personalization,pers,'personalization');
});

tsts('newEmpty',()=>{
	const hash=new Blake2s_256(Uint8Array.of(1));
	const sumEmpty='F99B9D2F1C3DDF9CC09409B55DEC9E74B0412C76BAB44264FF9DC0315D30AF24';
	const sum23='898ECB8907D62AE308376B00B5722F13F46BA7739835B9EA4683024AD6E411AF';

	assert.is(hex.fromBytes(hash.sum()),sumEmpty);
	hash.write(Uint8Array.of(2,3));
	assert.is(hex.fromBytes(hash.sum()),sum23);
	
	const h2=hash.newEmpty();
	assert.is(hex.fromBytes(h2.sum()),sumEmpty);
});

tsts(`bad salt size throws`,()=>{
	assert.throws(()=>new Blake2s_256(undefined,Uint8Array.of(1)));
});

tsts(`bad pers size throws`,()=>{
	assert.throws(()=>new Blake2s_256(undefined,undefined,Uint8Array.of(1)));
});

tsts(`sequential`,()=>{
	const h=Blake2s.Sequential(11);
	assert.is(h.size,11);
})

tsts.run();
