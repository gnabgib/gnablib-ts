/*! Copyright 2023 gnabgib MPL-2.0 */

import { utf8 } from '../../encoding/Utf8.js';
import { safety } from '../../primitive/Safety.js';

export class Command {
	readonly char: string;
	readonly human: string;
	constructor(char: string, human: string) {
		safety.lenExactly(char,1,'char');
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
				return this.Create;
			case 105: //i
				return this.InsCols;
			case 114: //r
				return this.RemCols;
			case 100: //d
				return this.Drop;
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
				return this.Insert;
			case 117: //u
				return this.Put;
			case 97: //a
				return this.Patch;
			case 100: //d
				return this.Delete;
		}
	}
}
