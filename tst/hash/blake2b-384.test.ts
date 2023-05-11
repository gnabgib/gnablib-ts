import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Blake2b_384 } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693 (b384)');



const ascii2bTests = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	[
		'',
		'B32811423377F52D7862286EE1A72EE540524380FDA1724A6F25D7978C6FD3244A6CAF0498812673C5E05EF583825100'
    ],
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_384
	[
		'The quick brown fox jumps over the lazy dog',
		'B7C81B228B6BD912930E8F0B5387989691C1CEE1E65AADE4DA3B86A3C9F678FC8018F6ED9E2906720C8D2A3AEDA9C03D',
    ],
	[
		'The quick brown fox jumps over the lazy cog',
		'927A1F297873CBE887A93B2183C4E2EBA53966BA92C6DB8B87029A1D8C673471D09740676CCED79C5016838973F630C3',
    ],
	[
		'The quick brown fox jumps over the lazy dof',
		'F5DF965BDBB28F443E522A303D4D1CE66AA7CE8635148D545A2A25C3B0F335E6EA30E7EB15C531EAE35F7C3D9056DDD1',
    ],
	[
		'BLAKE',
		'573299FC9C5BA26892944E520F9C91E74173551CFF42707DBC1673D028468C9203DFE5E73157ACFD7D86F823CE40E9F7',
    ],
];
for (const [source,expect] of ascii2bTests) {
	const b = utf8.toBytes(source);
	tsts(`Blake2b (${source}):`, () => {
		const hash=new Blake2b_384();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
