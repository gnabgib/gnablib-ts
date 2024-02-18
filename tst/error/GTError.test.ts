import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { GTError } from '../../src/error/GTError';

const tsts = suite('GTError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new GTError('$noun',1,2);
	assert.is(e.name, 'GTError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('GTError') > 0, true);

	assert.is(e.message.startsWith('$noun should be >2'),true, 'message');
	assert.is(e.gt,2);
    assert.is(e.value,1);
});

tsts.run();
