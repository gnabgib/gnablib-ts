import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ctEq, ctSelect, filter, padStart, reverse, splitChars, splitLen } from '../../src/primitive/XtString';

const tsts = suite('stringExt');

const splitChars_tests:[string,string[]][]=[
	["abc",["a","b","c"]],
	["hannah",["h","a","n","n","a","h"]],
	["🙂😊🙂✈",["🙂","😊","🙂","✈"]],
	['👪',['👪']],//https://emojipedia.org/family
];
for(const [source,expect] of splitChars_tests) {
	tsts(`splitChars(${source})`,()=>{
		assert.equal(splitChars(source),expect);
	})
}

const splitLen_comma_tests:[string,number,string][]=[
	["abc",1,"a,b,c"],
	["hannah",2,"ha,nn,ah"],
	["🙂😊🙂✈",1,"🙂,😊,🙂,✈"],
	["🙂😊🙂✈",2,"🙂😊,🙂✈"],
];
for(const [source,width,expect] of splitLen_comma_tests) {
	tsts(`splitLen(${source},${width}).join(,)`,()=>{
		const split=splitLen(source,width);
		assert.equal(split.join(","),expect);
	})
}

tsts(`splitLen(Lorem ipsum,40)`,()=>{
	const split=splitLen("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut",40);
	assert.equal(
		split.join("\n"),
		"Lorem ipsum dolor sit amet, consectetur \n"+
		"adipiscing elit, sed do eiusmod tempor i\n"+
		"ncididunt ut labore et dolore magna aliq\n"+
		"ua. Ut enim ad minim veniam, quis nostru\n"+
		"d exercitation ullamco laboris nisi ut"
	)
});

const reverse_tests:[string,string][]=[
	['ab', 'ba'],
	['StringExt', 'txEgnirtS'],
	['✈', '✈'], //https://unicode-table.com/en/2708/
	//Problematic because they're >1 "char" in JS, ie greater than 0xffff
	['🙂', '🙂'], //https://unicode-table.com/en/1F642/
	['😊', '😊'], //https://unicode-table.com/en/1F60A/
	['🧑‍🤝‍🧑', '🧑‍🤝‍🧑'], //https://unicode.org/emoji/charts/full-emoji-list.html#family - 5points
	['mañana','anañam'],//https://mathiasbynens.be/notes/javascript-unicode
	['Hello World 😃🎉', '🎉😃 dlroW olleH'],
];
for(const [source,rev] of reverse_tests) {
	tsts(`reverse(${source})`,()=>{
		assert.equal(reverse(source),rev);
	});
	tsts(`reverse(${rev})`,()=>{
		assert.equal(reverse(rev),source);
	});
}

const padStart_tests:[string,number,string|undefined,string][]=[
	['a',4,'_','___a'],
	['a',4,undefined,'   a'],
	['a',4,'()',')()a'],//Padding happens, and then the final result is truncated
	['😊',4,'.','..😊'],//This may seem illogical, but this emoji counts as "2" characters in JS
	['Fargo',4,'.','Fargo'],//Since src is already long enough, nothing happens - including truncation
	['a',4,'','a'],//Because pad is zero length, no padding happens - don't do this
];
for (const [src,len,fill,expect] of padStart_tests) {
	tsts(`padStart(${src},${len},${fill})`,()=>{
		assert.equal(padStart(src,len,fill),expect);
	});
}

const filter_tests:[string,string|RegExp,string|undefined,string][]=[
	["password","ao",undefined,"psswrd"],
	["password!",/\w/g,"*","********!"],
];
for(const [src,ignore,replace,expect] of filter_tests) {
	tsts(`filter(${src},${ignore},${replace})`,()=>{
		assert.equal(filter(src,ignore,replace),expect);
	});
}

const eq_tests:string[]=[
	'ab',
	'StringExt',
	'✈',
	'🙂',
	'😊',
	'🧑‍🤝‍🧑',
	'Hello World 😃🎉'
];
for (const a of eq_tests) {
	const b=a;
	tsts(`${a} (ct)== ${b}`,()=>{
		assert.equal(ctEq(a,b),true);
	});

}

const neq_tests:[string,string][]=[
	['ab','a'],
	['StringExt','StringExt '],
	['✈','🙂'],
	['🙂','😊'],
	['😊',':)'],
	['🧑‍🤝‍🧑','🙂'],
	['Hello World 😃🎉','Hello world 😃🎉']
];
for (const [a,b] of neq_tests) {
	tsts(`! ${a} (ct)== ${b}`,()=>{
		assert.equal(ctEq(a,b),false);
	});
	tsts(`! ${b} (ct)== ${a}`,()=>{
		assert.equal(ctEq(b,a),false);
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
		assert.equal(ctSelect(a,b,true),a);
	});
	tsts(`select(${a},${b},false)`,()=>{
		assert.equal(ctSelect(a,b,false),b);
	});
}

tsts(`ctSelect(a,b) with diff lengths throws`,()=>{
	assert.throws(()=>ctSelect('a','bee',true));
	assert.throws(()=>ctSelect('a','bee',false));
});


tsts.run();
