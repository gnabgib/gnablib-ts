import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { AtMostError } from '../../src/error/AtMostError';

const tsts = suite('AtMostError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new AtMostError('$noun', 0, 0);
	assert.is(e.name, 'AtMostError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('AtMostError') > 0, true);

	assert.is(e.message, '$noun should be at most 0, got 0', 'message');
	assert.is(e.noun, '$noun');
	assert.is(e.value, 0, 'value');
});

tsts.run();
