import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { LTError } from '../../src/error/LTError';

const tsts = suite('LTError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new LTError('$noun', 0, 0);
	assert.is(e.name, 'LTError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('LTError') > 0, true);

	assert.is(e.message, '$noun should be <0, got 0', 'message');
	assert.is(e.noun, '$noun');
	assert.is(e.value, 0, 'value');
	assert.is(e.lt, 0, 'lt');
});

tsts.run();
