// import { suite } from 'uvu';
// import * as assert from 'uvu/assert';
// import { MCG62089911 } from '../../src/prng/lcg';

// const tsts = suite('MCG62089911');
// //https://oeis.org/A096559/b096559.txt
// const seq: number[] = [
// 	62089911, 847344462, 
//     1061653656, 
//     //1954074819, 226824280, 953102500, 1452288378,
// 	// 50913524, 2133871779, 1843965925, 427233754, 195855103, 1546822229,
// 	// 1652729917, 1636805220, 217994169, 1312006067, 208869911, 310792805,
// 	// 675992938, 1109700100, 855351136, 863373758, 885033221, 1298364675, 713854363,
// 	// 1924618021, 1280619909, 552259181, 1602049679, 1580195619, 399451320,
// 	// 530557419, 1220073117, 1843376223, 478718582, 261876033, 317665274, 221443356,
// 	// 1071677702, 1777566597, 429346311, 370808770, 2110187302, 1511648920,
// 	// 1144481185, 674904784, 1855187720, 1020840261, 1313853678, 1782483439,
// 	// 436269853, 1348420719, 257934639, 308950519, 1166157494, 1230340855,
// 	// 1311682651, 457797032, 237431577, 1762535578, 715546732, 295392176,
// 	// 2067924138, 915278519, 1954691887, 668279101, 787208356, 441651519, 55919245,
// 	// 1597022300, 1698515682, 1153790829, 1764010772, 907202622, 1217840279,
// 	// 232478184, 50006307, 1607144902, 526882026, 893045196, 1673704997, 1029499950,
// 	// 120066438, 130874163, 829254784, 51603526, 1997883951, 1614669923, 393967367,
// 	// 941476615, 2145477429, 1039361284, 1080518719, 2113883591, 41850662,
// 	// 1421360848, 932845682, 2090351081, 1431377323,
// ];

// let seed = 1;
// const rng = MCG62089911(seed);

// for (const expect of seq) {
// 	const n = rng();
// 	tsts(`MCG62089911(${seed})`, () => {
// 		assert.equal(n, expect);
// 	});
// 	seed = n;
// }
// console.log(847344462*62089911)

// tsts.run();
