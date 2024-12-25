import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { mt19937c } from '../../src/prng/mersenneTwister';

const tsts = suite('mt19937c');
//https://oeis.org/A221557/b221557.txt
const seq: number[] = [
	3499211612, 581869302, 3890346734, 3586334585, 545404204, 
	4161255391, 3922919429, 949333985, 2715962298, 1323567403, 
	418932835, 2350294565, 1196140740, 809094426, 2348838239, 
	4264392720, 4112460519, 4279768804, 4144164697, 4156218106, 
	676943009, 3117454609, 4168664243, 4213834039, 4111000746, 
	471852626, 2084672536, 3427838553, 3437178460, 1275731771,
	609397212, 20544909, 1811450929, 483031418, 3933054126, 
	2747762695, 3402504553, 3772830893, 4120988587, 2163214728, 
	2816384844, 3427077306, 153380495, 1551745920, 3646982597, 
	910208076, 4011470445, 2926416934, 2915145307, 1712568902, 
	3254469058, 3181055693, 3191729660, 2039073006, 1684602222, 
	1812852786, 2815256116, 746745227, 735241234, 1296707006,
	3032444839, 3424291161, 136721026, 1359573808, 1189375152, 
	3747053250, 198304612, 640439652, 417177801, 4269491673, 
	3536724425, 3530047642, 2984266209, 537655879, 1361931891, 
	3280281326, 4081172609, 2107063880, 147944788, 2850164008, 
	1884392678, 540721923, 1638781099, 902841100, 3287869586, 
	219972873, 3415357582, 156513983, 802611720, 1755486969,
	2103522059, 1967048444, 1913778154, 2094092595, 2775893247, 
	3410096536, 3046698742, 3955127111, 3241354600, 3468319344,
];

const rng = mt19937c();
let i = 0;

for (const expect of seq) {
	const act = rng();
	tsts(`mt19937c(${i})`, () => {
		assert.equal(act, expect);
	});
	i++;
}

//Skip a head a few numbers :D
for(;i<999;i++) rng();
tsts(`mt19937c(1000)`, () => {
    assert.equal(rng(), 1341017984);
});

tsts.run();