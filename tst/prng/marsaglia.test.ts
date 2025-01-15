import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Marsaglia } from '../../src/prng/marsaglia';

const tsts = suite('Marsaglia');
const seq_def:number[]=[
	0, 2, 2, 3, 9, 5, 5
];
const rng_def=Marsaglia.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Marsaglia(23).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

const seq_1:number[]=[
	6, 6, 9, 7, 7, 6, 0, 4, 4, 6, 8, 1, 1, 7, 2, 6, 7, 5, 4, 7, 4, 8, 0, 5, 0,
	3, 8, 9, 8, 3, 3, 0, 2, 2, 3, 9, 5, 5, 3, 1, 8, 8, 2, 7, 3, 2, 4, 5, 2, 5,
	1, 9, 4, 9, 6, 1, 0, 1,/*end of period, repeats*/
];
const rng_1=Marsaglia.seed(1);
i=0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`Marsaglia(1).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Marsaglia(1).nextU16`,()=>{
	const rng_1b=Marsaglia.seed(1);
	assert.equal(rng_1b.bitGen,4,'Max 4 bits of random');
	//Note these numbers come from seq_1 above
	assert.equal(rng_1b.nextU16(),6<<12|6<<8|9<<4|7);
	assert.equal(rng_1b.nextU16(),7<<12|6<<8|0<<4|4);
	assert.equal(rng_1b.nextU16(),4<<12|6<<8|8<<4|1);
})

tsts(`Marsaglia(,false) save returns empty, restore throws`,()=>{
	const r=Marsaglia.new();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>Marsaglia.restore(sav));
})

tsts(`Marsaglia().save/restore loop`,()=>{
	const r=Marsaglia.new(true);
	assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
	const sav=r.save();
	assert.equal(sav.length,1,'save length');
	assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
	assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

	const r2=Marsaglia.restore(sav);    
	assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
	assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

	assert.is(Object.prototype.toString.call(r).indexOf("marsaglia")>0,true,'toString is set');
});


tsts.run();
