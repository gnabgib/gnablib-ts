import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mcg } from '../../src/prng/mcg';

const tsts = suite('Mcg.48271');
//https://oeis.org/A221556/b221556.txt
const seq_def: number[] = [
	48271, 182605794, 1291394886, 1914720637, 2078669041, 407355683, 1105902161,
	854716505, 564586691, 1596680831, 192302371, 1203428207, 1250328747,
	1738531149, 1271135913, 1098894339, 1882556969, 2136927794, 1559527823,
	2075782095, 638022372, 914937185, 1931656580, 1402304087, 1936030137,
	2064876628, 353718330, 1842513780, 1947433875, 631416347, 2010567813,
	890442452, 662405787, 1105724094, 849178936, 1696049367, 1479919876,
	1168816941, 1272185027, 201068705, 1308858262, 928270262, 1287522347,
	1814467857, 1057382352, 1659675143, 153892771, 412013968, 480194461,
	1675824860, 180318217, 389431516, 1324346645, 1243696899, 1587659744,
	674592135, 942409124, 884730203, 1951824771, 2130959757, 1239222494,
	352020689, 1500063655, 719080959, 978785428, 163677341, 276590098, 374787159,
	948709761, 80100956, 1082682476, 1003765604, 1243427070, 1447645967,
	200599677, 143244144, 1788215331, 837051536, 409875951, 355190910, 2058462609,
	2127735996, 243877847, 1869683330, 1336273608, 1444510476, 1318652553,
	1262088783, 324062450, 547639202, 1715708819, 1273555394, 1925544752,
	583514338, 425095546, 580853881, 851194519, 206008598, 1391748448, 1358404307,
];
const rng_def=Mcg.new48271();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mcg.48271().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}
for(;i<9999;i++) rng_def.rawNext();
tsts('Mcg.48271().rawNext[9999]',()=>{assert.equal(rng_def.rawNext(),399268537);});

//Unsourced
const seq_42:number[]=[
	2027382,
	1226992407,
	551494037,
	961371815,
];
const rng_42=Mcg.seed48271(42);
i=0;
for (const expect of seq_42) {
	const act = rng_42.rawNext();
	tsts(`Mcg.48271(42).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Mcg(,false) save returns empty, restore throws`,()=>{
	const r=Mcg.new48271();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>Mcg.restore(sav));
})

tsts(`Mcg().save/restore loop`,()=>{
	const r=Mcg.new48271(true);
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
