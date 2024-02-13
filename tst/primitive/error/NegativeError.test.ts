import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { NegativeError } from '../../../src/primitive/error/NegativeError';

const tsts = suite('NegativeError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new NegativeError('$noun', 0);
	assert.is(e.name, 'NegativeError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('NegativeError') > 0, true);

	assert.is(e.message, '$noun should be positive, got 0', 'message');
	assert.is(e.noun, '$noun');
	assert.is(e.value, 0, 'value');
});

tsts.run();
