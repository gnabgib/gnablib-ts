import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { LessThanError } from '../../src/error/LessThanError';

const tsts = suite('LessThanError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new LessThanError('$noun', 0, 0);
	assert.is(e.name, 'LessThanError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('LessThanError') > 0, true);

	assert.is(e.message, '$noun should be < 0, got 0', 'message');
	assert.is(e.noun, '$noun');
	assert.is(e.value, 0, 'value');
	assert.is(e.lessThan, 0, 'lessThan');
});

tsts.run();
