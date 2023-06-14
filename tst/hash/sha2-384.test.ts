import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import {
	Sha384,
} from '../../src/hash/Sha2';

const tsts = suite('SHA2/RFC 6234 | FIPS 180-4 (384)');

const ascii384Pairs = [
	//Source: RFC6234
	//test 1
	[
		'abc', 
		'CB00753F45A35E8BB5A03D699AC65007272C32AB0EDED1631A8B605A43FF5BED8086072BA1E7CC2358BAECA134C825A7'],
	//test 2
	[
		'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', 
		'09330C33F71147E83D192FC782CD1B4753111B173B3B05D22FA08086E3B0F712FCC7C71A557E2DB966C3E9FA91746039'],
	//test 4
	[
		'0123456701234567012345670123456701234567012345670123456701234567'.repeat(10), 
		'2FC64A4F500DDB6828F6A3430B8DD72A368EB7F3A8322A70BC84275B9C0B3AB00D27A5CC3C2D224AA6B61A0D79FB4596'],	
	//Source: https://en.wikipedia.org/wiki/SHA-2
	[
		'',
		'38B060A751AC96384CD9327EB1B1E36A21FDB71114BE07434C0CC7BF63F6E1DA274EDEBFE76F65FBD51AD2F14898B95B',
	],
	//Others https://md5calc.com/hash/sha512/
	[
		'The quick brown fox jumps over the lazy dog',
		'CA737F1014A48F4C0B6DD43CB177B0AFD9E5169367544C494011E3317DBF9A509CB1E5DC1E85A941BBEE3D7F2AFBC9B1',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'ED892481D8272CA6DF370BF706E4D7BC1B5739FA2177AAE6C50E946678718FC67A7AF2819A021C2FC34E91BDB63409D7',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'098CEA620B0978CAA5F0BEFBA6DDCF22764BEA977E1C70B3483EDFDF1DE25F4B40D6CEA3CADF00F809D422FEB1F0161B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'726380F3D326979940FA452DEE34ACA2078B500D44C3248B7BF1774E0AE897184F47545195973D66CD0B37AA6F997FD1',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'0E775AEBF86FFE53688A3AD5D7B8D3E638DAE9A2D3C4376C137728203FB93D602AEA54B832F1B8089A86056C8107EAB9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'5992E73ECA77AE910E231103CCA480BE6ECB3756779E2A8B6228BC995249784FE8E5FDDAC1CCF595F3D1A91859CB7B42',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'2F175852B6F9267DF834FB943D079119E99DFB3545A28281F051EB3EF1923254CF960110D9CD79EAACCB48247379CD85',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'305A570332D183258A54013F2C682B5EB9BD8089D4CD79F0B1F0206EC9978B3A02F9651C8D9AEC78E452E659AE9DDA0B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'A8C30E50D509BA66410B977003DB579BBF5FD755C02E15547DE7FE15BC157E8849DCE83E3E6AF34F01A868F1BC34FEC0',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345',
		'7F033975953AA346E68C9986F12E0D95A7700B6EED22BEE5B1BBAED7ACFD8C36E7A2CD5C27022CC73F73B5EED48094FB',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'41AEB23C31B529FDD7A2BD53EAFDEEBFEFEDC5D3F51530C77F0F270F053983EC1BFC4B41EB9512A718AB54EBEDFA9B06',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'7B1C0D943B94C40517F47E38B5147A03256A24EB5DF4AE71D0B100702F55B1A4266094E674DDB07ACBE9A59459433319',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'4AD52B55D7258337B7FB895B612E66EAD39489EFBA298934B7ED1845CE2F1C6427E82F814205D0D61BA41835E3872AC4',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'1761336E3F7CBFE51DEB137F026F89E01A448E3B1FAFA64039C1464EE8732F11A5341A6F41E0C202294736ED64DB1A84',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'B12932B0627D1C060942F5447764155655BD4DA0C9AFA6DD9B9EF53129AF1B8FB0195996D2DE9CA0DF9D821FFEE67026',
	],
	[
		'gnabgib',
		'E1E6A3B70FC8D3A57CDBCFE941EF1CA90D38D7BB0BE570C193BDD2AD4ECD7EDA159CB26436A3F9FCEBACE59B7493B563',
	],
];

for (const [source,expect] of ascii384Pairs) {
	const b = utf8.toBytes(source);
	tsts('Sha384: ' + source, () => {
		const hash=new Sha384();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const hex384Pairs=[
	//test 6
	[
		'b9', 
		'BC8089A19007C0B14195F4ECC74094FEC64F01F90929282C2FB392881578208AD466828B1C6C283D2722CF0AD1AB6938'],
	//Test 8
	[
		'a41c497779c0375ff10a7f4e08591739',
		'C9A68443A005812256B8EC76B00516F0DBB74FAB26D665913F194B6FFB0E91EA9967566B58109CBC675CC208E4C823F7'
	],
	//test 10
	[
		'399669e28f6b9c6dbcbb6912ec10ffcf74790349b7dc8fbe4a8e7b3b5621db0f3e7dc87f823264bbe40d1811c9ea2061e1c84ad10a23fac1727e7202fc3f5042e6bf58cba8a2746e1f64f9b9ea352c711507053cf4e5339d52865f25cc22b5e87784a12fc961d66cb6e89573199a2ce6565cbdf13dca403832cfcb0e8b7211e83af32a11ac17929ff1c073a51cc027aaedeff85aad7c2b7c5a803e2404d96d2a77357bda1a6daeed17151cb9bc5125a422e941de0ca0fc5011c23ecffefdd09676711cf3db0a3440720e1615c1f22fbc3c721de521e1b99ba1bd5577408642147ed096', 
		'4F440DB1E6EDD2899FA335F09515AA025EE177A79F4B4AAF38E42B5C4DE660F5DE8FB2A5B2FBD2A3CBFFD20CFF1288C0'],
	
];
for (const [source,expect] of hex384Pairs) {
	tsts('Sha384: 0x' + source, () => {
		const h = hex.toBytes(source);
		const hash=new Sha384();
		hash.write(h);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
