import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { msvc } from '../../src/prng/';

const tsts = suite('msvc');
tsts(`msvc`, () => {
	// https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/rand?view=msvc-170
	const r = msvc(1792);
	assert.equal(r(),5890);
	assert.equal(r(),1279);
	assert.equal(r(),19497);
	assert.equal(r(),1207);
	assert.equal(r(),11420);
	assert.equal(r(),3377);
	assert.equal(r(),15317);
	assert.equal(r(),29489);
	assert.equal(r(),9716);
	assert.equal(r(),23323)
    //console.log(r());
});
tsts.run();
