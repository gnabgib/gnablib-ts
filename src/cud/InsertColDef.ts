import type { ACudColType } from './types/CudColType';
import { ColName } from './ColName';
import { FromBinResult } from '../primitive/FromBinResult';
import { cudColTypeFromBin } from './types/cudColTypeFromBin';

export class InsertColDef {
	readonly name: ColName;
	readonly type: ACudColType;
	readonly default: unknown|undefined;

	public constructor(name: ColName, type: ACudColType, defValue?: unknown) {
		this.name = name;
		this.type = type;
        if (defValue!==null || defValue!==undefined) {
            this.default=defValue;
        }
	}

	toBin(): Uint8Array {
		// N(2-64)T(1-N)D(1-N)
		// n = name (2-64 bytes). NOTE bytes not chars
		// t = type (1-N bytes)
		// d = default (1-n bytes)
		const n = this.name.toBin();
		const t = this.type.toBin();
		const d = this.type.unknownBin(this.default);

        const ret= new Uint8Array(n.length + t.length + d.length);
        ret.set(n);
        let ptr=n.length;
        ret.set(t,ptr);
        ptr+=t.length;
        ret.set(d,ptr);
        return ret;
	}

	toJSON(): Record<string, unknown> {
        interface retType extends Record<string, unknown> {}
		const c:retType = {};
		c[this.name.name] = this.type.cudType + (this.type.nullable ? '?' : '');
		if (this.default !== undefined) c.default = this.default;
		return c;
	}

    static fromBin(bin:Uint8Array,pos=0):FromBinResult<InsertColDef> {
        let ptr=pos;
        const nFrom=ColName.fromBin(bin,pos);
        if (!nFrom.success) return new FromBinResult<InsertColDef>(0,undefined,'InsertColDef.fromBin missing name: '+nFrom.reason);
        ptr+=nFrom.byteLen;

        const tFrom=cudColTypeFromBin(bin,ptr);
        if (!tFrom.success) return new FromBinResult<InsertColDef>(0,undefined,'InsertColDef.fromBin missing type: '+tFrom.reason);
        ptr+=tFrom.byteLen;

        const dFrom=tFrom.value!.binUnknown(bin,ptr);
        if (!dFrom.success) return new FromBinResult<InsertColDef>(0,undefined,'InsertColDef.fromBin missing default: '+dFrom.reason);
        ptr+=dFrom.byteLen;

        return new FromBinResult(ptr-pos,new InsertColDef(nFrom.value!,tFrom.value!,dFrom.value));
    }
}
