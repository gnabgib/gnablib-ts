/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { FromBinResult } from '../../primitive/FromBinResult.js';
import { Bin1, Bin2, Bin3, Bin4ish } from './Bin.js';
import { Bool } from './Bool.js';
import { ColType } from './ColType.js';
import type { ACudColType } from './ACudColType.js';
import { DateTimeCol } from './DateTime.js';
import { Float4, Float8 } from './Float.js';
import { Id2, Id4, Id8 } from './Id.js';
import { Int2, Int4, Int8 } from './Int.js';
import { Ref2 } from './Ref.js';
import { Utf81, Utf82, Utf83, Utf84ish } from './Utf8.js';

const nullMarker = 0x80;

export function cudColTypeFromBin(
	bin: Uint8Array,
	pos = 0
): FromBinResult<ACudColType> {
	const byte = bin[pos];
	const nullable = (byte & nullMarker) === nullMarker;
	const c = byte & ~nullMarker; //Mask only the type bits
	switch (c) {
		case ColType.Bin1:
			return new FromBinResult(1, new Bin1(nullable));
		case ColType.Bin2:
			return new FromBinResult(1, new Bin2(nullable));
		case ColType.Bin3:
			return new FromBinResult(1, new Bin3(nullable));
		case ColType.Bin4ish:
			return new FromBinResult(1, new Bin4ish(nullable));
		case ColType.Bool:
			return new FromBinResult(1, new Bool(nullable));
		case ColType.DateTime:
			return new FromBinResult(1, new DateTimeCol(nullable));
		case ColType.Float4:
			return new FromBinResult(1, new Float4(nullable));
		case ColType.Float8:
			return new FromBinResult(1, new Float8(nullable));
		case ColType.Id2:
			if (nullable) break; //Invalid
			return new FromBinResult(1, new Id2());
		case ColType.Id4:
			if (nullable) break; //Invalid
			return new FromBinResult(1, new Id4());
		case ColType.Id8:
			if (nullable) break; //Invalid
			return new FromBinResult(1, new Id8());
		case ColType.Int2:
			return new FromBinResult(1, new Int2(nullable));
		case ColType.Int4:
			return new FromBinResult(1, new Int4(nullable));
		case ColType.Int8:
			return new FromBinResult(1, new Int8(nullable));
		case ColType.Ref2:
		case ColType.Ref4:
		case ColType.Ref8:
			//Note Ref2 doesn't matter because it's a factory that picks the correct ref based on c
			return Ref2.fromBinSub(c, nullable, 1, bin, pos + 1);
		case ColType.Utf81:
			return new FromBinResult(1, new Utf81(nullable));
		case ColType.Utf82:
			return new FromBinResult(1, new Utf82(nullable));
		case ColType.Utf83:
			return new FromBinResult(1, new Utf83(nullable));
		case ColType.Utf84ish:
			return new FromBinResult(1, new Utf84ish(nullable));
	}
	return new FromBinResult<ACudColType>(
		0,
		undefined,
		`cudColTypeFromBin unknown colType ${c}`
	);
}
