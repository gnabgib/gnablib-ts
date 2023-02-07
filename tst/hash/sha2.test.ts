import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import {
	sha2_224,
	sha2_256,
	sha2_384,
	sha2_512,
	sha2_512_224,
	sha2_512_256,
} from '../../src/hash/Sha2';

const tsts = suite('SHA2/RFC 6234 | FIPS 180-4');

const ascii244Pairs = [
	//Source: https://en.wikipedia.org/wiki/SHA-2
	['', 'D14A028C2A3A2BC9476102BB288234C415A2B01F828EA62AC5B3E42F'],
	[
		'The quick brown fox jumps over the lazy dog',
		'730E109BD7A8A32B1CB9D9A09AA2325D2430587DDBC0C38BAD911525',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'619CBA8E8E05826E9B8C519C0A5C68F4FB653E8A3D8AA04BB2C8CD4C',
	],
	//Source: https://md5calc.com/hash/sha224/
	[
		'The quick brown fox jumps over the lazy cog',
		'FEE755F44A55F20FB3362CDC3C493615B3CB574ED95CE610EE5B1E9B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'FB2B7C3A66B5F2A611AC6CA9B0043DB11A2C0B4C8DF6AFEA2FAC6CE9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'624F9D91CCDFDD8FF042D74044192ED73B5CB658B09F9CD96E4E984A',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'3F2FA9E0C21C10647C3EE834CCCD79F5580D1423B35FF44B24420BFD',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'A4619941EF6A62D83370E1081DAD2CF420E8B7E24FB8263F7035EEA2',
	],
	//Test the second block
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'39C1BDF3C0BDCC97BF0A8E0C99C909AB50191C0C3E99E3B0BF74F631',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'BAD325803FF15DD690CFE5FF76DA902893B9F0EFB0CC4391479F175C',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'D1F673D37803088BDD720124E600857292A707087482B17B816A75C0',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'86BF0E445831C0E64154CE884C21AB679576340421CBDEEB69D2DA04',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'F4DAB6DA745213E3B6AF34026E90DBD2D64228E3A739C3C6E56BD4B2',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'BFF72B4FCB7D75E5632900AC5F90D219E05E97A7BDE72E740DB393D9',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'B50AECBE4E9BB0B57BC5F3AE760A8E01DB24F203FB3CDCD13148046E',
	],
	['gnabgib', 'BAC996C38B530F7031B6B838AD4803970BDE1DFC567E5CF6D4CC7722'],
];

for (const pair of ascii244Pairs) {
	tsts('sha224:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_224(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

const ascii256Pairs = [
	//Source: https://en.wikipedia.org/wiki/SHA-2
	['', 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'],
	//Source: https://md5calc.com/hash/sha256/
	[
		'The quick brown fox jumps over the lazy dog',
		'D7A8FBB307D7809469CA9ABCB0082E4F8D5651E46D3CDB762D02D0BF37C9E592',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'EF537F25C895BFA782526529A9B63D97AA631564D5D789C2B765448C8635FB6C',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'E4C4D8F3BF76B692DE791A173E05321150F7A345B46484FE427F6ACC7ECC81BE',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'64CC0AB1A88EFEACD64FA79ECE34EDE044CD6D1C32C2A1C2791E5BA2063C1BEA',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'22065AAC53D33CEE54C281A300CB298DF54F418BF228A7026C50EB75FB998115',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'E52A12238B3937D167C5CC243C4176720918EB8CB8C8E183039546E927A3760B',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'59521AA5A72BFD087FC7B180EFFF1E20DC27A7D6232CC1EBB733183D02A8C062',
	],
	//Test the second block
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'F50E77559FCFB0BE5B298F780857CF0C5F06AF725838431F7C9DA48FF024BA30',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'A70CDC426E03C55F6BAB861695327E7C7B032D7DA1ED0F1ACA0C252125D4E77A',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345',
		'51B86686860C3C22559132D1496EBA4282F0638C58775E7EC21868F49DAE52F9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'5AF72ECE9EB8F1B47555F587D77EEC84B241BC772B434FDA00B60DB5B7039BAD',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'76EC7029B93450299621397A86535C8E5BD9D7007E28BF545E2B8721535A8170',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'52EFE19808BE6F333BFAED7BBB1EC0B71D4C118591BC199A3516F946E86BFC63',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'DB4BFCBD4DA0CD85A60C3C37D3FBD8805C77F15FC6B1FDFE614EE0A7C8FDB4C0',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'F371BC4A311F2B009EEF952DD83CA80E2B60026C8E935592D0F9C308453C813E',
	],
	[
		'gnabgib',
		'25C883DEF68E954E0E6EB057B8CE3636720A32D5544BCCBF98F780227286D6F7',
	],
];

for (const pair of ascii256Pairs) {
	tsts('sha256:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_256(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

//JS doesn't support 64bit ints, so we can't easily do these two:
const ascii384Pairs = [
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

for (const pair of ascii384Pairs) {
	tsts('sha384:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_384(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

const ascii512_224Pairs = [
	//['','CF83E1357EEFB8BDF1542850D66D8007D620E4050B5715DC83F4A921D36CE9CE47D0D13C5D85F2B0FF8318D2877EEC2F63B931BD47417A81A538327AF927DA3E'],
	['gnabgib', '63C7E6AE3EB9365315BF7D8E41F3B1737597962C66B3A29143394299'],
];

for (const pair of ascii512_224Pairs) {
	tsts('sha512/224:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_512_224(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

const ascii512_256 = [
	[
		'gnabgib',
		'FDED532E1BA8CF9F02F2F2A47B1E61275ED2818A2FAD8818AFD3114A01849D5B',
	],
];
for (const pair of ascii512_256) {
	tsts('sha512/256:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_512_256(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

const ascii512Pairs = [
	//Source: https://en.wikipedia.org/wiki/SHA-2
	[
		'',
		'CF83E1357EEFB8BDF1542850D66D8007D620E4050B5715DC83F4A921D36CE9CE47D0D13C5D85F2B0FF8318D2877EEC2F63B931BD47417A81A538327AF927DA3E',
	],
	//Others https://md5calc.com/hash/sha512/
	[
		'The quick brown fox jumps over the lazy dog',
		'07E547D9586F6A73F73FBAC0435ED76951218FB7D0C8D788A309D785436BBB642E93A252A954F23912547D1E8A3B5ED6E1BFD7097821233FA0538F3DB854FEE6',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'91EA1245F20D46AE9A037A989F54F1F790F0A47607EEB8A14D12890CEA77A1BBC6C7ED9CF205E67B7F2B8FD4C7DFD3A7A8617E45F3C463D481C7E586C39AC1ED',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'3EEEE1D0E11733EF152A6C29503B3AE20C4F1F3CDA4CB26F1BC1A41F91C7FE4AB3BD86494049E201C4BD5155F31ECB7A3C8606843C4CC8DFCAB7DA11C8AE5045',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'59034B1D16E36833960DDAA51EDAE7858F462E7D49A4E9F7383BAF1553AF7B21F4E1502362048BA70EA94C975C3B5B005E99775ED099EA4C7349EF21F01AA9CD',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0',
		'50DFF3E8D4A7C4EFD1B5D336412DB781384B42FFE960413A0060334CCD8C93FC04B10D984E31DD3E8AEB791D7EE202927F444B88AA063E5E042CED9266120F1D',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
		'7C6E8AE9985EC6123F95CAC60DC630729C70472DE027C3634246527798BBF1C2BFD7BFA91BC082CD04A758A8A192A88A63E3E633A21E9A82D6AB0130E0D9A8E9',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012',
		'3037112031AEBDE97B47CF86A08FD53C7273010B35A13DA3C6321A7A3567AD0D6985B74CD6F94A89A1800DB203C91DA0AE8B0D12D6AB335E7F2F00723AB112A5',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123',
		'1FA0ABEBA710B6A54FFFC6D9FEFB0E64CC7D105170C840A732D2886DB173F38CC7D6EC40D1CC064A90794D9E8DB9D5A2D37829BE9A0D7EFF8550FC62ADECB2F0',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234',
		'BDB3E36C98BD645E70427A4001F8EC910F6CA63235C25202FED3F5B9BABCA1980231CE2FEBF4A38A2029425C23E196D2B2AF9438B4FDFC573F297AB3EDEF9139',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345',
		'7772E7E534F2C8C24919329B55FC1F85DDE970C2D8EB857A12061FDD2C73BA5A4D842C6930DC893563D6128101A4BD27A224D5A054945340DFF107947093E0BA',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456',
		'B5D6E32452CFA02A8690F18E1C5243FE3C6378D8CA3EE3245DC755B51D8C6904F2C50EB1B3416AF897D7752BD4B9C800CE3CFC470DFD96A38EB007A429309DD4',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567',
		'69403723418415475A4B2FD077D628A252038016BE7902AD6C2CE11BB0C6CEA5BFD343BA5486F532DF03835DB68DB95E6AF4CB4D1BA914E699F68CC122891B84',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678',
		'E170A07451A013E066C96DF6110AE81E4B647B5AD0A71F904E4D94C817EC2AAC8E7EB946979DC95056B4807119C12D5D2E22081E33FAFC288A6E0FF1166E32BC',
	],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'1E07BE23C26A86EA37EA810C8EC7809352515A970E9253C26F536CFC7A9996C45C8370583E0A78FA4A90041D71A4CEAB7423F19C71B9D5A3E01249F0BEBD5894',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'72EC1EF1124A45B047E8B7C75A932195135BB61DE24EC0D1914042246E0AEC3A2354E093D76F3048B456764346900CB130D2A4FD5DD16ABB5E30BCB850DEE843',
	],
	[
		'gnabgib',
		'5B58B7C85B03D1F9AA15D0972EEE02C632214CCF5622B8DB7D940EC30E17DCA053EA11468DB229A82907F216BE33D3C041CA616622FB5AABCBB05D4008CC889C',
	],
];

for (const pair of ascii512Pairs) {
	tsts('sha512:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const m = sha2_512(b);
		assert.is(hex.fromBytes(m), pair[1]);
	});
}

tsts.run();
