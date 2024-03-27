/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { utf8 } from '../../codec/Utf8.js';
import { sLen } from '../../safe/safe.js';

export class Command {
	readonly char: string;
	readonly human: string;
	constructor(char: string, human: string) {
		sLen('char', char).exactly(1).throwNot();
		this.char = char;
		this.human = human;
	}
	toBin(): Uint8Array {
		return utf8.toBytes(this.char);
	}
}

export class CommandCtrl extends Command {
	get isCreate(): boolean {
		return this.char === 'c';
	}
	get isInsCols(): boolean {
		return this.char === 'i';
	}
	get isRemCols(): boolean {
		return this.char === 'r';
	}
	get isDrop(): boolean {
		return this.char === 'd';
	}

	static get Create(): CommandCtrl {
		return new CommandCtrl('c', 'create');
	}
	static get InsCols(): CommandCtrl {
		return new CommandCtrl('i', 'insert-cols');
	}
	static get RemCols(): CommandCtrl {
		return new CommandCtrl('r', 'remove-cols');
	}
	static get Drop(): CommandCtrl {
		return new CommandCtrl('d', 'drop');
	}

	/**
	 * Decode a CommandCtrl from a byte
	 * @param byte
	 * @returns CommandCtrl or undefined if bad byte-value
	 */
	static fromByte(byte: number): CommandCtrl | undefined {
		switch (byte) {
			case 99: //c
				return CommandCtrl.Create;
			case 105: //i
				return CommandCtrl.InsCols;
			case 114: //r
				return CommandCtrl.RemCols;
			case 100: //d
				return CommandCtrl.Drop;
		}
	}
}

export class CommandData extends Command {
	get isInsert(): boolean {
		return this.char === 'i';
	}
	get isPut(): boolean {
		return this.char === 'u';
	}
	get isPatch(): boolean {
		return this.char === 'a';
	}
	get isDelete(): boolean {
		return this.char === 'd';
	}

	static get Insert(): CommandData {
		return new CommandData('i', 'insert');
	}
	static get Put(): CommandData {
		return new CommandData('u', 'put');
	}
	static get Patch(): CommandData {
		return new CommandData('a', 'patch');
	}
	static get Delete(): CommandData {
		return new CommandData('d', 'delete');
	}

	/**
	 * Decode a CommandData from a byte
	 * @param byte
	 * @returns CommandData or undefined if bad byte-value
	 */
	static fromByte(byte: number): CommandData | undefined {
		switch (byte) {
			case 105: //i
				return CommandData.Insert;
			case 117: //u
				return CommandData.Put;
			case 97: //a
				return CommandData.Patch;
			case 100: //d
				return CommandData.Delete;
		}
	}
}
