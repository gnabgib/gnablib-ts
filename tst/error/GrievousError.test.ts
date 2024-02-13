import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { GrievousError } from '../../src/error/GrievousError';

const tsts = suite('GrievousError');
//While these are rigid we need to make sure the error message is reasonable

tsts(`build`, () => {
	const e = new GrievousError('situation');
	assert.is(e.name, 'GrievousError', 'name');
	const str = Object.prototype.toString.call(e);
	assert.is(str.indexOf('GrievousError') > 0, true);

	assert.is(e.message.startsWith('Most grievous '),true, 'message');
	assert.is(e.reason, 'situation');
});

tsts.run();
