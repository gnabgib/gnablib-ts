import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ip from '../../src/net/Ip';
import { Cidr } from '../../src/net/Cidr';
import { CidrValue, IpTree } from '../../src/net/IpTree';

const tsts = suite('IpTree');

tsts('1.2.3.4 contains', () => {
	const t = new IpTree();
	const addr = ip.V4.fromParts(1, 2, 3, 4);
	t.addIp(addr, {});
	assert.equal(t.contains(addr), true);
	//One before not included
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 3)), false);
	//One after not included
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 5)), false);
});

tsts('192.168.1.2-192.168.1.4 contains', () => {
	const t = new IpTree();
	const i2 = ip.V4.fromParts(192, 168, 1, 2);
	const i3 = ip.V4.fromParts(192, 168, 1, 3);
	const i4 = ip.V4.fromParts(192, 168, 1, 4);
	t.addRange(i2, i4, {});

	assert.equal(t.contains(ip.V4.fromParts(192, 168, 0, 2)), false);
	assert.equal(t.contains(ip.V4.fromParts(192, 168, 1, 1)), false);
	assert.equal(t.contains(i2), true);
	assert.equal(t.contains(i3), true);
	assert.equal(t.contains(i4), true);
	assert.equal(t.contains(ip.V4.fromParts(192, 168, 1, 5)), false);
});

tsts('1.2.3.0/24 contains', () => {
	const t = new IpTree();
	t.addCidr(Cidr.fromString('1.2.3.0/24'), {});

	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 0)), true);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 1)), true);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 128)), true);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 3, 255)), true);

	assert.equal(t.contains(ip.V4.fromParts(1, 2, 2, 0)), false);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 2, 255)), false);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 4, 0)), false);
	assert.equal(t.contains(ip.V4.fromParts(1, 2, 4, 255)), false);
});

// prettier-ignore
const rangeToList=[
    //Nice CIDR
    ['192.168.1.0','192.168.1.63',['192.168.1.0/26']],
    //Slightly short
    ['192.168.1.0','192.168.1.62',['192.168.1.0/27','192.168.1.32/28','192.168.1.48/29','192.168.1.56/30','192.168.1.60/31','192.168.1.62/32']],
    //Slightly long
    ['192.168.1.0','192.168.1.64',['192.168.1.0/26','192.168.1.64/32']],
];
for (const test of rangeToList) {
	const st = test[0] as string;
	const en = test[1] as string;
	//Convert expected into a Cidr array
	const exp: CidrValue[] = [];
	for (const s of test[2]) exp.push({ cidr: Cidr.fromString(s), value: {} });

	tsts('rangeToList ' + st + '-' + en, () => {
		const t = new IpTree();
		t.addRange(ip.V4.fromString(st), ip.V4.fromString(en), {});

		const list = t.listCidr();
		assert.equal(list, exp);
	});
}

// prettier-ignore
const twoRangeMerge=[
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
for (const test of twoRangeMerge) {
	tsts('two range merge = ' + test[4], () => {
		const t = new IpTree();
		t.addRange(ip.V4.fromString(test[0]), ip.V4.fromString(test[1]), {});
		t.addRange(ip.V4.fromString(test[2]), ip.V4.fromString(test[3]), {});
		assert.equal(t.listCidr(), [{ cidr: Cidr.fromString(test[4]), value: {} }]);
	});
}

// prettier-ignore
const twoCidrMerge=[
    //Subset:
    ['127.1.2.0/24','127.1.2.8/29','127.1.2.0/24'],
    //Superset:
    ['127.1.2.8/29','127.1.2.0/24','127.1.2.0/24'],
    //Sequential:
    ['127.1.2.0/24','127.1.3.0/24','127.1.2.0/23'],
    //Can't represent overlap in CIDR (=subset)
];
for (const test of twoCidrMerge) {
	tsts('two cidr merge = ' + test[2], () => {
		const t = new IpTree();
		t.addCidr(Cidr.fromString(test[0]), {});
		t.addCidr(Cidr.fromString(test[1]), {});
		assert.equal(t.listCidr(), [{ cidr: Cidr.fromString(test[2]), value: {} }]);
	});
}

tsts('merge, ip+range+cidr', () => {
	const t = new IpTree();
	//Note range and cidr overlap
	t.addIp(ip.V4.fromString('192.168.1.0'), {});
	t.addRange(
		ip.V4.fromString('192.168.1.1'),
		ip.V4.fromString('192.168.1.129'),
		{}
	);
	t.addCidr(Cidr.fromString('192.168.1.128/25'), {});
	assert.equal(t.listCidr(), [
		{ cidr: Cidr.fromString('192.168.1.0/24'), value: {} },
	]);
});

tsts.run();
