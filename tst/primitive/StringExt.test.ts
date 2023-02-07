import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as stringExt from '../../src/primitive/StringExt';

const tsts = suite('StringExt');

const reverses = [
	['ab', 'ba'],
	['StringExt', 'txEgnirtS'],
	['✈', '✈'], //https://unicode-table.com/en/2708/
	//Problematic because they're >1 "char" in JS, ie greater than 0xffff
	['🙂', '🙂'], //https://unicode-table.com/en/1F642/
	['😊', '😊'], //https://unicode-table.com/en/1F60A/
	['🧑‍🤝‍🧑', '🧑‍🤝‍🧑'], //https://unicode.org/emoji/charts/full-emoji-list.html#family - 5points
	['Hello World 😃🎉', '🎉😃 dlroW olleH'],
];

for (const pair of reverses) {
	tsts('Reverse:' + pair[0], () => {
		assert.is(stringExt.reverse(pair[0]), pair[1]);
	});
}

tsts.run();
