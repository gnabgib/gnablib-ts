import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mcg } from '../../src/prng/mcg';

const tsts = suite('Mcg.16807');

//source: https://oeis.org/A096550/b096550.txt
const seq_def: number[] = [
	16807, 282475249, 1622650073, 984943658, 1144108930, 470211272, 101027544,
	1457850878, 1458777923, 2007237709, 823564440, 1115438165, 1784484492,
	74243042, 114807987, 1137522503, 1441282327, 16531729, 823378840, 143542612,
	896544303, 1474833169, 1264817709, 1998097157, 1817129560, 1131570933,
	197493099, 1404280278, 893351816, 1505795335, 1954899097, 1636807826,
	563613512, 101929267, 1580723810, 704877633, 1358580979, 1624379149,
	2128236579, 784558821, 530511967, 2110010672, 1551901393, 1617819336,
	1399125485, 156091745, 1356425228, 1899894091, 585640194, 937186357,
	1646035001, 1025921153, 510616708, 590357944, 771515668, 357571490,
	1044788124, 1927702196, 1952509530, 130060903, 1942727722, 1083454666,
	1108728549, 685118024, 2118797801, 1060806853, 571540977, 194847408,
	2035308228, 158374933, 1075260298, 824938981, 595028635, 1962408013,
	1137623865, 997389814, 2020739063, 107554536, 1635339425, 1654001669,
	1777724115, 269220094, 34075629, 1478446501, 1864546517, 1351934195,
	1581030105, 1557810404, 2146319451, 1908194298, 500782188, 657821123,
	753799505, 1102246882, 1269406752, 1816731566, 884936716, 1807130337,
	578354438, 892053144,
];
const rng_def=Mcg.new16807();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mcg.16807().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}
for(;i<9998;i++) rng_def.rawNext();
tsts('Mcg.16807().rawNext[9998]',()=>{assert.equal(rng_def.rawNext(),1484786315);});

//Unsourced
const seq_42:number[]=[
	705894,
	1126542223,
	1579310009,
	565444343,
];
const rng_42=Mcg.seed16807(42);
i=0;
for (const expect of seq_42) {
	const act = rng_42.rawNext();
	tsts(`Mcg.16807(42).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Mcg(,false) save returns empty, restore throws`,()=>{
	const r=Mcg.new16807();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>Mcg.restore(sav));
})

tsts(`Mcg().save/restore loop`,()=>{
	const r=Mcg.new16807(true);
	assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
	const sav=r.save();
	assert.equal(sav.length,17,'save length');
	assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
	assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

	const r2=Mcg.restore(sav);    
	assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
	assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

	assert.is(Object.prototype.toString.call(r).indexOf("mcg")>0,true,'toString is set');
});

tsts.run();
