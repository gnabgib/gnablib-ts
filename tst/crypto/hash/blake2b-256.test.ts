import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Blake2b_256, Blake2b } from '../../../src/crypto/hash';
import { U64 } from '../../../src/primitive/number';

const tsts = suite('Blake2/RFC 7693 (b256)');

const ascii2bTests = [
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_256
	[
		'The quick brown fox jumps over the lazy dog',
		'01718CEC35CD3D796DD00020E0BFECB473AD23457D063B75EFF29C0FFA2E58A9',
    ],
	[
		'The quick brown fox jumps over the lazy cog',
		'036C13096926B3DFCCFE3F233BD1B2F583B818B8B15C01BE65AF69238E900B2C',
    ],
	[
		'The quick brown fox jumps over the lazy dof',
		'4F2ABD883017E2BFC5B56ABB87D5B19915AEE76A5E51BF1659B6853A2D3A3EBA',
    ],
	[
		'BLAKE',
		'7C28CC8AD9601E556DBBF421C1B385FC7E7D34F1AE614899B21491B8C1F67B19',
    ],
];
for (const [source,expect] of ascii2bTests) {
	const b = utf8.toBytes(source);
	tsts(`Blake2b (${source}):`, () => {
		const hash=new Blake2b_256();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`build`,()=>{
	//Just settings to show the diff
	const salt=Uint8Array.of(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15);
	const pers=Uint8Array.of(0xf,0xe,0xd,0xc,0xb,0xa,9,8,7,6,5,4,3,2,1,0);
	const hash=new Blake2b(1,2,3,4,5,6,7,undefined,salt,pers);
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
	const hash=new Blake2b_256(Uint8Array.of(1));
	const sumEmpty='5314F7FA3E115F00445BD303E5459C955D4AA769CE925AF37BE82E19AB68D1BC';
	const sum23='DA5E4D50EF1CB6FFC8030485E624AB3DD42C92E29476BCD3BB861404C6C9A173';

	assert.is(hex.fromBytes(hash.sum()),sumEmpty);
	hash.write(Uint8Array.of(2,3));
	assert.is(hex.fromBytes(hash.sum()),sum23);
	
	const h2=hash.newEmpty();
	assert.is(hex.fromBytes(h2.sum()),sumEmpty);
});

tsts(`bad salt size throws`,()=>{
	assert.throws(()=>new Blake2b_256(undefined,Uint8Array.of(1)));
});

tsts(`bad pers size throws`,()=>{
	assert.throws(()=>new Blake2b_256(undefined,undefined,Uint8Array.of(1)));
});

tsts(`sequential`,()=>{
	const h=Blake2b.Sequential(11);
	assert.is(h.size,11);
})

tsts.run();
