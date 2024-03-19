import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { NotEnoughSpaceError } from '../../src/error/NotEnoughSpaceError';

const tsts = suite('NotEnoughSpaceError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new NotEnoughSpaceError('$noun', 1, 3);
	assert.is(e.name, 'NotEnoughSpaceError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('NotEnoughSpaceError') > 0, true);

	assert.is(e.message, '$noun needs 1, have 3', 'message');
	assert.is(e.noun, '$noun');
	assert.is(e.need, 1, 'need');
    assert.is(e.available, 3, 'available');
});

tsts.run();
