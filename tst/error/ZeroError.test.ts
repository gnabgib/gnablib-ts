import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ZeroError } from '../../src/error/ZeroError';

const tsts = suite('ZeroError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new ZeroError('$noun');
	assert.is(e.name, 'ZeroError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('ZeroError') > 0, true);

	assert.is(e.message, '$noun should not be 0', 'message');
	assert.is(e.noun, '$noun');
});

tsts.run();
