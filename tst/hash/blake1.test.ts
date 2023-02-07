import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { blake256, blake512 } from '../../src/hash/Blake';

const tsts = suite('Blake1');

//log.ignoreUnder=0;

/* Blake32/64 wre submitted with 10/14 rounds, but then tweaked in the SHA3 competition to 14/16 rounds
 *  which makes testing problematic.. The original test vectors can't be used for testing.
 * Helpfully the finally SHA3 submissions were renamed Blake256/512, but then Blake2(s|b) was released on
 *  top and Blake1 is hard to find (looks like the original website was taken down)
 */

const ascii256HexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	['', '716F6E863F744B9AC22C97EC7B76EA5F5908BC5B2F67C61510BFC4751384EA7A'],
	//Recalculated test vectors from Blake.pdf/Blake32 (14 rounds)
	['\0', '0CE8D4EF4DD7CD8D62DFDED9D4EDB0A774AE6A41929A74DA23109E8F11139C87'],
	[
		'\0'.repeat(72),
		'D419BAD32D504FB7D44D460C42C5593FE544FA4C135DEC31E21BD9ABDCC22D41',
	],
	//Newly calculated
	[
		'The quick brown fox jumps over the lazy cog',
		'6D1A80BD305F1DBE4FD65B319E5C753EC1C2E446D228690818D8A6DB7E3E43C8',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		'7DB614DBDB3C6B4E181DDA88D9FEE1B0325EB5594B50894108AE3528C00A87E0',
	],
	[
		'gnabgib',
		'8551389A6510BE491B969BC63115AAFAD99D0E9BD31FFA7155D95F4A305A2D2C',
	],
	//https://github.com/dchest/blake256/blob/master/blake256_test.go
	[
		'The quick brown fox jumps over the lazy dog',
		'7576698EE9CAD30173080678E5965916ADBB11CB5245D386BF1FFDA1CB26C9D7',
	],
	['BLAKE', '07663E00CF96FBC136CF7B1EE099C95346BA3920893D18CC8851F22EE2E36AA6'],
	[
		"'BLAKE wins SHA-3! Hooray!!!' (I have time machine)",
		'18A393B4E62B1887A2EDF79A5C5A5464DAF5BBB976F4007BEA16A73E4C1E198E',
	],
	[
		"HELP! I'm trapped in hash!",
		'1E75DB2A709081F853C2229B65FD1558540AA5E7BD17B04B9A4B31989EFFA711',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		'4181475CB0C22D58AE847E368E91B4669EA2D84BCD55DBF01FE24BAE6571DD08',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congu',
		'AF95FFFC7768821B1E08866A2F9F66916762BFC9D71C4ACB5FD515F31FD6785A',
	],
	//https://www.seanet.com/~bugbee/crypto/blake/blake_test.py
	[
		'\0'.repeat(55),
		'DC980544F4181CC43505318E317CDFD4334DAB81AE035A28818308867CE23060',
	],
	[
		'\0'.repeat(56),
		'26AE7C289EBB79C9F3AF2285023AB1037A9A6DB63F0D6B6C6BBD199AB1627508',
	],
	[
		'\0'.repeat(72),
		'D419BAD32D504FB7D44D460C42C5593FE544FA4C135DEC31E21BD9ABDCC22D41',
	],

	//Blake.pdf test vectors (10 rounds)
	//['\0','D1E39B457D2250B4F5B152E74157FBA4C1B423B87549106B07FD3A3E7F4AEB28'],
	//['\0'.repeat(72),'8A638488C318C5A8222A1813174C36B4BB66E45B09AFDDFD7F2B2FE3161B7A6D'],
];

for (const pair of ascii256HexPairs) {
	tsts('blake256:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const hash = blake256(b);
		assert.is(hex.fromBytes(hash), pair[1]);
	});
}

const ascii512HexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	[
		'',
		'A8CFBBD73726062DF0C6864DDA65DEFE58EF0CC52A5625090FA17601E1EECD1B628E94F396AE402A00ACC9EAB77B4D4C2E852AAAA25A636D80AF3FC7913EF5B8',
	],
	// FFS why can't wikipedia be consistent
	[
		'The quick brown fox jumps over the lazy dog',
		'1F7E26F63B6AD25A0896FD978FD050A1766391D2FD0471A77AFB975E5034B7AD2D9CCF8DFB47ABBBE656E1B82FBC634BA42CE186E8DC5E1CE09A885D41F43451',
	],
	[
		'The quick brown fox jumps over the lazy dof',
		'A701C2A1F9BAABD8B1DB6B75AEE096900276F0B86DC15D247ECC03937B370324A16A4FFC0C3A85CD63229CFA15C15F4BA6D46AE2E849ED6335E9FF43B764198A',
	],
	//https://github.com/dchest/blake512/blob/master/blake512_test.go
	[
		'BLAKE',
		'7BF805D0D8DE36802B882E65D0515AA7682A2BE97A9D9EC1399F4BE2EFF7DE07684D7099124C8AC81C1C7C200D24BA68C6222E75062E04FEB0E9DD589AA6E3B7',
	],
	[
		"'BLAKE wins SHA-3! Hooray!!!' (I have time machine)",
		'19BB3A448F4EEF6F0B9374817E96C7C848D96F20C5A3E4B808173D97AEDE52CB396506AC20E174A1D53D9E51E443E7447855F2C9E8C6E4247FA8E4F54CDA5897',
	],
	[
		"HELP! I'm trapped in hash!",
		'465D047D9695F258A47AF7B94A03D903CB60AE1286F263AAC8628774EE90828BEA31FB7FE1D3385AF364080A317115C8DF8596C3C608D8DE77B95BFF702A3984',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
		'68376FE303EE09C3A220EE330BCCC9FA9FBA6DC41741507F195F5457FFA75864076F71BC07E94620123EC24F70458C2BA3DD1FA31A7FEFC036D430C962C0969B',
	],
	[
		//cspell: disable-next
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mat',
		'C805573523A7F386732329B6C001E6FE1E1D1842B8152D8F205B86078E571AFBAAF4C560CF084FE297E05AAC14AE4DED7FDFA2DB461FB05D3ADD28DE3F2293C3',
	],
	//https://www.seanet.com/~bugbee/crypto/blake/blake_test.py
	[
		'\0',
		'97961587F6D970FABA6D2478045DE6D1FABD09B61AE50932054D52BC29D31BE4FF9102B9F69E2BBDB83BE13D4B9C06091E5FA0B48BD081B634058BE0EC49BEB3',
	],
	[
		'\0'.repeat(144),
		'313717D608E9CF758DCB1EB0F0C3CF9FC150B2D500FB33F51C52AFC99D358A2F1374B8A38BBA7974E7F6EF79CAB16F22CE1E649D6E01AD9589C213045D545DDE',
	],
	[
		'\0'.repeat(111),
		'125695C5CC01DE48D8B107C101778FC447A55AD3440A17DC153C6C652FAECDBF017AED68F4F48826B9DFC413EF8F14AE7DFD8B74A0AFCF47B61CE7DCB1058976',
	],
	[
		'\0'.repeat(112),
		'AA42836448C9DB34E0E45A49F916B54C25C9EEFE3F9F65DB0C13654BCBD9A938C24251F3BEDB7105FA4EA54292CE9EBF5ADEA15CE530FB71CDF409387A78C6FF',
	],

	//Blake.pdf test vectors (14 rounds)
	//['\0','765F7084548226C3E6F4779B954661DF49A272E2BA16635F17A3093756AA93642A92E5BDDB21A3218F72B7FD44E9FA19F86A86334EBEDA0F4D4204BF3B6BED68'],
	//['\0'.repeat(144),'EAB730280428210571F3F8DEE678A9B1BBEF58DF55471265B71E262B8EFFBA2533C15317C3E9F897B269ED4146AED0F3A29827060055CA14652753EFE20A913E'],
];

for (const pair of ascii512HexPairs) {
	tsts('blake512:' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		const hash = blake512(b);
		assert.is(hex.fromBytes(hash), pair[1]);
	});
}

tsts.run();
