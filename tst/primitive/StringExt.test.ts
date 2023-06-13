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

const eqTest:string[]=[
	'ab',
	'StringExt',
	'✈',
	'🙂',
	'😊',
	'🧑‍🤝‍🧑',
	'Hello World 😃🎉'
];
for (const a of eqTest) {
	const b=a;
	tsts(`${a} ==.ct ${a}`,()=>{
		assert.equal(stringExt.ctEq(a,b),true);
	});

}
const neqTest:[string,string][]=[
	['ab','a'],
	['StringExt','StringExt '],
	['✈','🙂'],
	['🙂','😊'],
	['😊',':)'],
	['🧑‍🤝‍🧑','🙂'],
	['Hello World 😃🎉','Hello world 😃🎉']
];
for (const [a,b] of neqTest) {
	tsts(`!${a} ==.ct ${b}`,()=>{
		assert.equal(stringExt.ctEq(a,b),false);
	});
}


const selTest:[string,string][]=[
	['a','b'],
	['✈','🙂'],//Note the string.lengths are different, but the character count isn't
	['😊','🙂'],
	//['🧑‍🤝‍🧑','🙂'],//This is a compound emoji, so the lengths are different even though they both look like 1 char
	['Hello World 😃🎉', '🎉😃 dlroW olleH'],
];
for(const [a,b] of selTest) {
	tsts(`select(${a},${b},true)`,()=>{
		assert.equal(stringExt.ctSelect(a,b,true),a);
	});
	tsts(`select(${a},${b},false)`,()=>{
		assert.equal(stringExt.ctSelect(a,b,false),b);
	});
}

tsts(`ctSelect(a,b) with diff lengths throws`,()=>{
	assert.throws(()=>stringExt.ctSelect('a','bee',true));
	assert.throws(()=>stringExt.ctSelect('a','bee',false));
});


tsts.run();
