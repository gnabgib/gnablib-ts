import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ContentError } from '../../src/error/ContentError';
import util from 'util';

const tsts = suite('ContentError');
//While these are rigid we need to make sure the error message is reasonable

const arg1Set: [string, string][] = [
	['$${reason}', 'Invalid; $${reason}'],
	['unreasonable', 'Invalid; unreasonable'],
];
for (const [reason, expect] of arg1Set) {
	tsts(`ContentError(${reason})`, () => {
		const c = new ContentError(reason);
		assert.is(c.message, expect, 'message');
		assert.is(c.reason, reason, 'reason');
		assert.is(c.key, '', 'key');
		assert.is(c.value, undefined, 'value');
	});
}

const arg2Set: [string, unknown, string][] = [
	['$${reason}', '$${value}', 'Invalid; $${reason} ($${value})'],
	['unreasonable', 'invaluable', 'Invalid; unreasonable (invaluable)'],
];
for (const [reason, value, expect] of arg2Set) {
	tsts(`ContentError(${reason},${value})`, () => {
		const c = new ContentError(reason, value);
		assert.is(c.message, expect, 'message');
		assert.is(c.reason, reason, 'reason');
		assert.is(c.key, '', 'key');
		assert.is(c.value, value, 'value');
	});
}

const arg3Set: [string, string, unknown, string][] = [
	[
		'$${reason}',
		'$${key}',
		'$${value}',
		'Invalid $${key}; $${reason} ($${value})',
	],
    [
		'HerpyDerp',
		'logic',
		false,
		'Invalid logic; HerpyDerp (false)',
	],
];
for (const [reason, key, value, expect] of arg3Set) {
	tsts(`ContentError(${reason},${key},${value})`, () => {
		const c = new ContentError(reason, key, value);
		assert.is(c.message, expect, 'message');
		assert.is(c.reason, reason, 'reason');
		assert.is(c.key, key, 'key');
		assert.is(c.value, value, 'value');
	});
}

tsts('name', () => {
    const o=new ContentError("You stink Strawberry!");
	assert.is(o.name, 'ContentError');
});

tsts('[Symbol.toStringTag]', () => {
    const o=new ContentError("You stink Strawberry!");
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('ContentError') > 0, true);
});

tsts.run();
