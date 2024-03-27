//Interface barrel file
// This is here so TypeDoc correctly sees these interfaces as public (/publishable)
// even though we don't need to export them for JS usage (saving bytes)

//Crypto
export type { IAeadCrypt } from '../crypto/interfaces/IAeadCrypt.js';
export type { IBlockCrypt } from '../crypto/interfaces/IBlockCrypt.js';
export type { IHash } from '../crypto/interfaces/IHash.js';
export type { IFullCrypt } from '../crypto/interfaces/IFullCrypt.js';
export type { IPad } from '../crypto/interfaces/IPad.js';
//Cud
export type { IMysqlType } from '../cud/interfaces/IMysqlType.js';
export type { IPostgresType } from '../cud/interfaces/IPostgresType.js';
export type { ISqliteType } from '../cud/interfaces/ISqliteType.js';
export type { IValid } from '../cud/interfaces/IValid.js';
//DateTime
export type {
	IDurationExactParts,
	IDurationParts,
} from '../datetime/interfaces/IDurationParts.js';
//Primitive
export type { ISerializer } from '../primitive/interfaces/ISerializer.js';
export type { IReadWriteArray } from '../primitive/interfaces/IReadWriteArray.js';
export type { IMatchResult } from '../primitive/interfaces/IMatchResult.js';
export type { IReadArray } from '../primitive/interfaces/IReadArray.js';
export type { IWriteTyped } from '../primitive/interfaces/IWriteTyped.js';
export type { IReadTyped } from '../primitive/interfaces/IReadTyped.js';
export type { IMatchDetail } from '../primitive/interfaces/IMatchDetail.js';
export type { ICidrValue } from '../primitive/interfaces/ICidrValue.js';
export type { ILengther } from '../primitive/interfaces/ILengther.js';
export type { IBufferer } from '../primitive/interfaces/IBufferer.js';
export type { IBuildable } from '../primitive/interfaces/IBuildable.js';
export type { IValueMerge } from '../primitive/interfaces/IValueMerge.js';
//PRNG
export type { IRandFloat } from '../prng/interfaces/IRandFloat.js';
export type { IRandInt } from '../prng/interfaces/IRandInt.js';
//Runtime
export type {
	ConfigValue,
	IConfigEnvCollector,
	IConfigOracle,
	ValueSetter,
} from '../runtime/interfaces/ForConfig.js';
export {
	LogLevel,
	type ILogEntry,
	type ILogTarget,
	type ILogOracle,
} from '../runtime/interfaces/ForLog.js';
// Safe
export type {
	ISafeNum,
	ISafeStr,
	ISafeBool,
	ISafeLen,
} from '../safe/interfaces/ForSafe.js';
// Test
export type { errorSetting } from '../test/interfaces/errorSetting.js';
