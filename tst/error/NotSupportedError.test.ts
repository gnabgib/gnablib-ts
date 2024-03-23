import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { NotSupportedError } from '../../src/error/NotSupportedError';

const tsts = suite('NotSupportedError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new NotSupportedError();
	assert.is(e.name, 'NotSupportedError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('NotSupportedError') > 0, true);

	assert.is(e.message, 'not supported', 'message');
});

tsts.run();
