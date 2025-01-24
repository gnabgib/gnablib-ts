import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Cidr, ICidrValue, IpTree, IpV4 } from '../../../src/primitive/net';
import util from 'util';

const tsts = suite('IpTree');

tsts('1.2.3.4 contains', () => {
	const t = new IpTree();
	const addr = IpV4.fromParts(1, 2, 3, 4);
	t.addIp(addr, {});
	assert.equal(t.contains(addr), true);
	//One before not included
	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 3)), false);
	//One after not included
	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 5)), false);
});

tsts('192.168.1.2-192.168.1.4 contains', () => {
	const t = new IpTree();
	const i2 = IpV4.fromParts(192, 168, 1, 2);
	const i3 = IpV4.fromParts(192, 168, 1, 3);
	const i4 = IpV4.fromParts(192, 168, 1, 4);
	t.addRange(i2, i4, {});

	assert.equal(t.contains(IpV4.fromParts(192, 168, 0, 2)), false);
	assert.equal(t.contains(IpV4.fromParts(192, 168, 1, 1)), false);
	assert.equal(t.contains(i2), true);
	assert.equal(t.contains(i3), true);
	assert.equal(t.contains(i4), true);
	assert.equal(t.contains(IpV4.fromParts(192, 168, 1, 5)), false);
});

tsts('1.2.3.0/24 contains', () => {
	const t = new IpTree();
	t.addCidr(Cidr.fromString('1.2.3.0/24'), {});

	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 0)), true);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 1)), true);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 128)), true);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 255)), true);

	assert.equal(t.contains(IpV4.fromParts(1, 2, 2, 0)), false);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 2, 255)), false);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 4, 0)), false);
	assert.equal(t.contains(IpV4.fromParts(1, 2, 4, 255)), false);
});

// prettier-ignore
const rangeToList:[string,string,string[]][]=[
    //Nice CIDR
    ['192.168.1.0','192.168.1.63',['192.168.1.0/26']],
    //Slightly short
    ['192.168.1.0','192.168.1.62',['192.168.1.0/27','192.168.1.32/28','192.168.1.48/29','192.168.1.56/30','192.168.1.60/31','192.168.1.62/32']],
    //Slightly long
    ['192.168.1.0','192.168.1.64',['192.168.1.0/26','192.168.1.64/32']],
];
for (const [st,en,expStr] of rangeToList) {
	//Convert expected into a Cidr array
	const exp: ICidrValue<object>[] = [];
	for (const s of expStr) exp.push({ cidr: Cidr.fromString(s), value: {}});

	tsts('rangeToList ' + st + '-' + en, () => {
		const t = new IpTree();
		t.addRange(IpV4.fromString(st), IpV4.fromString(en), {});

		const list = t.listCidr();
		assert.equal(list, exp);
	});
}

// prettier-ignore
const twoRangeMerge:[string,string,string,string,string][]=[
    //Subset:
    ['192.168.0.0','192.168.0.255','192.168.0.10','192.168.0.25','192.168.0.0/24'],
    //Superset:
    ['192.168.0.10','192.168.0.25','192.168.0.0','192.168.0.255','192.168.0.0/24'],
    //Sequential:
    ['192.168.0.0','192.168.0.255','192.168.1.0','192.168.1.255','192.168.0.0/23'],
    ['192.168.0.0','192.168.0.127','192.168.0.128','192.168.0.255','192.168.0.0/24'],
    //Overlap:
    ['192.168.0.0','192.168.0.100','192.168.0.64','192.168.1.255','192.168.0.0/23'],
];
for (const [start0,end0,start1,end1,cidr] of twoRangeMerge) {
	tsts('two range merge = ' + cidr, () => {
		const t = new IpTree();
		t.addRange(IpV4.fromString(start0), IpV4.fromString(end0), {});
		t.addRange(IpV4.fromString(start1), IpV4.fromString(end1), {});
		assert.equal(t.listCidr(), [{ cidr: Cidr.fromString(cidr), value: {} }]);
	});
}

// prettier-ignore
const twoCidrMerge:[string,string,string][]=[
    //Subset:
    ['127.1.2.0/24','127.1.2.8/29','127.1.2.0/24'],
    //Superset:
    ['127.1.2.8/29','127.1.2.0/24','127.1.2.0/24'],
    //Sequential:
    ['127.1.2.0/24','127.1.3.0/24','127.1.2.0/23'],
    //Can't represent overlap in CIDR (=subset)
];
for (const [cidr0,cidr1,expectCidr] of twoCidrMerge) {
	tsts('two cidr merge = ' + expectCidr, () => {
		const t = new IpTree();
		t.addCidr(Cidr.fromString(cidr0), {});
		t.addCidr(Cidr.fromString(cidr1), {});
		assert.equal(t.listCidr(), [{ cidr: Cidr.fromString(expectCidr), value: {} }]);
	});
}

tsts('merge, ip+range+cidr', () => {
	const t = new IpTree();
	//Note range and cidr overlap
	t.addIp(IpV4.fromString('192.168.1.0'), {});
	t.addRange(
		IpV4.fromString('192.168.1.1'),
		IpV4.fromString('192.168.1.129'),
		{}
	);
	t.addCidr(Cidr.fromString('192.168.1.128/25'), {});
	assert.equal(t.listCidr(), [
		{ cidr: Cidr.fromString('192.168.1.0/24'), value: {} },
	]);
});

tsts('[Symbol.toStringTag]', () => {
    const o=new IpTree();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('IpTree') > 0, true);
});

tsts('util.inspect',()=>{
    const o=new IpTree();
    const u=util.inspect(o);
    assert.is(u.startsWith('IpTree('),true);
	//assert.is(o.value)
});

tsts('1.2.3.0/24 contains', () => {
	const t = new IpTree();
	t.addCidr(Cidr.fromString('1.2.3.0/24'), 1);
	const cidrs=t.listCidr();
	assert.is(cidrs.length,1);
	assert.is(cidrs[0].value,1);

// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 0)), true);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 1)), true);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 128)), true);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 3, 255)), true);

// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 2, 0)), false);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 2, 255)), false);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 4, 0)), false);
// 	assert.equal(t.contains(IpV4.fromParts(1, 2, 4, 255)), false);
});

// tsts('general',()=>{
//     const o=new IpTree();
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();
