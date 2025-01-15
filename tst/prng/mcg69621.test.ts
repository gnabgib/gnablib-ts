import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mcg } from '../../src/prng/mcg';

const tsts = suite('Mcg.69621');
//Todo find a source
const seq_def: number[] = [
	69621, 552116347, 1082396834, 201323037, 1832878655, 1219051368, 874078441,
	971035822, 1699755902, 1619285207, 1953863635, 1883480414, 143449980,
	1332099030, 837788288, 2002546328, 344571154, 1995975644, 300997201,
	580703395, 623924873, 1121855264, 705093554, 2137119908, 20632473, 1934326537,
	1048329107, 1341531505, 406134281, 1705081099, 850154613, 1817516706,
	1151656245, 1009988753, 1369918892, 1079449368, 1154222763, 1452395730,
	828115688, 748843239, 754644200, 896424345, 1937057778, 74014185, 1128304732,
	899422959, 250165666, 691455416, 1824086184, 1111267272, 145393443,
	1346466792, 408366988, 382068915, 1287479473, 1788447600, 261022893,
	668212639, 693894858, 2009269553, 270783833, 1629783927, 593325128,
	1040786443, 199731029, 517355684, 1224348280, 283201509, 724894982,
	2047837322, 1042870632, 1421649049, 1254633846, 2113134288, 860059819,
	2085612945, 352051940, 977251529, 651796255, 230124598, 1276630738, 255428262,
	2006431542, 254115526, 806751660, 1570017222, 1398864209, 1941703339,
	1380069516, 1253923009, 2016075392, 1653698512, 1250820988, 798636051,
	1341402194, 2140791385, 81978697, 1574813758, 331048133, 1107567989,
];
const rng_def=Mcg.new69621();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mcg.69621().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}
for(;i<9999;i++) rng_def.rawNext();
tsts('Mcg.69621().rawNext[9999]',()=>{assert.equal(rng_def.rawNext(),190055451);});

//Unsourced
const seq_42:number[]=[
	2924082,
	1714050104,
	363510441,
	2013116613,
];
const rng_42=Mcg.seed69621(42);
i=0;
for (const expect of seq_42) {
	const act = rng_42.rawNext();
	tsts(`Mcg.69621(42).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Mcg(,false) save returns empty, restore throws`,()=>{
	const r=Mcg.new69621();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>Mcg.restore(sav));
})

tsts(`Mcg().save/restore loop`,()=>{
	const r=Mcg.new69621(true);
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
