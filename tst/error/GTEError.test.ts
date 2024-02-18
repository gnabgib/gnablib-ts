import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { GTEError } from '../../src/error/GTEError';

const tsts = suite('GTEError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new GTEError('$noun',1,2);
	assert.is(e.name, 'GTEError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('GTEError') > 0, true);

	assert.is(e.message.startsWith('$noun should be >=2'),true, 'message');
	assert.is(e.gte,2);
    assert.is(e.value,1);
});

tsts.run();
