import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { uri, utf8 } from '../../src/codec';
import { ContentError } from '../../src/primitive/error/ContentError';

const tsts = suite('Uri/RFC 3986');

const pairs = [
	['ab', 'ab'],
	[
		'foo://example.com:8042/over/there?name=ferret#nose',
		'foo%3A%2F%2Fexample.com%3A8042%2Fover%2Fthere%3Fname%3Dferret%23nose',
	],
	[
		'https://www.gnabgib.com/tools/base32/',
		'https%3A%2F%2Fwww.gnabgib.com%2Ftools%2Fbase32%2F',
	],
	//All reserved in ascii
	[
		":/?#[]@!$&'()*+,;=",
		'%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D',
	],
	// From the docs
	['A', 'A'],
	['À', '%C3%80'],
	['ア', '%E3%82%A2'],
	//Emoji
	['😊', '%F0%9F%98%8A'],
	['✈', '%E2%9C%88'],
	//Utf8 doc
	['$', '%24'],
	['£', '%C2%A3'],
	['€', '%E2%82%AC'],
	['𐍈', '%F0%90%8D%88'],
	['𐍈€£$£€𐍈', '%F0%90%8D%88%E2%82%AC%C2%A3%24%C2%A3%E2%82%AC%F0%90%8D%88'],
	['Ѐ', '%D0%80'],
	//Other choices
	['\0', '%00'],
];

for (const pair of pairs) {
	tsts('fromBytes: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		assert.is(uri.fromBytes(b), pair[1]);
	});

	tsts('toBytes: ' + pair[1], () => {
		const b = uri.toBytes(pair[1]);
		assert.is(utf8.fromBytes(b), pair[0]);
	});
}

tsts('toBytes throws on invalid character', () => {
	//The Ѐ char isn't allowed un URI encoding
	assert.throws(() => uri.toBytes('AЀB'));
});

tsts('toBytes with `ignore` drops the invalid character', () => {
	const b = uri.toBytes('AЀB', { invalid: 'ignore' });
	assert.is(utf8.fromBytes(b), 'AB');
});

tsts('toBytes with `copy` keeps the invalid character', () => {
	//Because of +8 over provision (by default), this will work,
	// but a longer invalid string might not!!
	const b = uri.toBytes('AЀB', { invalid: 'copy' });
	assert.is(utf8.fromBytes(b), 'AЀB');
});

tsts(
	'toBytes with `copy` truncates input when not enough over provisioning space',
	() => {
		//With 0 over provision, the second char eats up the rest of the output bytes
		// preventing the third char from getting decoded
		const b = uri.toBytes('AЀB', { invalid: 'copy', overProvisionOutput: 0 });
		assert.is(utf8.fromBytes(b), 'AЀ');
	}
);

const invalidUEncode = [
	'%0',
	//'H%D0ll',//Unfortunately an incomplete utf8 char doesn't throw (currently?)
	'He%2y', //%2y isn't valid hex
	'H%2', //%2 isn't enough hex chars
];

for (const invalid of invalidUEncode) {
	assert.throws(
		() => uri.toBytes(invalid),
		(e) => e instanceof ContentError && e.key == 'URI encoding',
		'Throws:' + invalid
	);
}

tsts.run();
