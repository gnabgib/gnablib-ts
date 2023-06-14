/*! Copyright 2023 gnabgib MPL-2.0 */

import { Cidr } from './Cidr.js';
import { IpV4 } from './Ip.js';

interface ITreeNode<T> {
	readonly value: T | undefined;
	contains(val: number, bit: number): boolean;
	output(
		position: number,
		bit: number,
		output: (position: number, bit: number, value: T) => void
	): void;
}

/**
 * All values below are represented
 * Leafs of the tree, only thing that renders output
 */
class AllTreeNode<T> implements ITreeNode<T> {
	private _value: T;

	constructor(value: T) {
		this._value = value;
	}

	get value(): T {
		return this._value;
	}

	contains(): boolean {
		return true;
	}

	output(
		position: number,
		bit: number,
		output: (position: number, bit: number, value: T) => void
	): void {
		output(position, 31 - bit, this._value);
	}
}

/**
 * No values below are represented (aka empty tree)
 */
class NoneNode<T> implements ITreeNode<T> {
	get value() {
		return undefined;
	}
	contains(): boolean {
		return false;
	}
	output(): void {
		//nop
	}
}

type valueMerge<T> = (value1: T, value2: T) => T;

/**
 * A node (or fork) that represents two paths
 */
class TreeNode<T> implements ITreeNode<T> {
	private _left: ITreeNode<T> = new NoneNode<T>();
	private _right: ITreeNode<T> = new NoneNode<T>();

	get value() {
		return undefined;
	}

	contains(val: number, bit: number): boolean {
		const odd = (val >> bit) & 1;
		return odd
			? this._right.contains(val, bit - 1)
			: this._left.contains(val, bit - 1);
	}

	output(
		position: number,
		bit: number,
		output: (position: number, bit: number, value: T) => void
	): void {
		if (bit < 0) {
			//The addTreeNode function shouldn't allow anything but an all/none node at max depth (32)
			// but just incase we made a code-mistake (ie. saw in early testing)
			throw new Error("C'est impossible");
		}
		//A TreeNode has no output.. it's just a fork in the path
		this._left.output(position, bit - 1, output);
		this._right.output(position | (1 << bit), bit - 1, output);
	}

	static add<T>(
		parent: ITreeNode<T>,
		position: number,
		bit: number,
		end: number,
		value: T,
		merge: valueMerge<T>
	): ITreeNode<T> {
		//A tree is default empty (none node) and slowly filled with data.
		// So a none node either stays or switches to all or normal nodes (forks /w left/right paths)

		//If we're at an all node, no further processing needed
		if (parent instanceof AllTreeNode) return parent;
		//if (parent === all) return parent;
		//If we've descended as far as we need to, make it an all node and be done
		if (bit <= end) return new AllTreeNode(value);
		//if (bit <= end) return all;

		//If this is a none node (ie not a TreeNode), switch (all has already been filtered)
		const ret: TreeNode<T> =
			parent instanceof TreeNode ? parent : new TreeNode();

		//Now descend
		const odd = (position >> bit) & 1;
		if (odd) {
			ret._right = TreeNode.add(
				ret._right,
				position,
				bit - 1,
				end,
				value,
				merge
			);
		} else {
			ret._left = TreeNode.add(ret._left, position, bit - 1, end, value, merge);
		}
		//If children are all, switch to all node
		if (ret._left instanceof AllTreeNode && ret._right instanceof AllTreeNode)
			return new AllTreeNode(merge(ret._left.value, ret._right.value));
		//if (ret._left === all && ret._right === all) return all;

		//Since you can't switch to none-nodes, and you only switch from if there are
		// children.. we don't need to check for children=none
		return ret;
	}
}

function pickFirst<T>(value1: T, value2: T): T {
	return value1;
}

export type CidrValue<T> = { cidr: Cidr; value: T };

export class IpTree<T> {
	private _root: ITreeNode<T> = new NoneNode<T>();
	private _merge: valueMerge<T>;

	constructor(merge?: valueMerge<T>) {
		this._merge = merge || pickFirst;
	}

	addIp(ipv4: IpV4, value: T): void {
		this._root = TreeNode.add(
			this._root,
			ipv4.toInt(),
			31,
			-1,
			value,
			this._merge
		);
	}

	addRange(start: IpV4, end: IpV4, value: T): void {
		let startInt = start.toInt();
		const endInt = end.toInt();
		while (startInt <= endInt) {
			let m = (startInt - 1) & ~startInt;
			while (startInt + m > endInt) {
				m >>= 1;
			}
			let bit = -1;
			let temp = m;
			while (temp != 0) {
				bit++;
				temp >>= 1;
			}
			this._root = TreeNode.add(
				this._root,
				startInt,
				31,
				bit,
				value,
				this._merge
			);
			startInt += m + 1;
		}
	}

	addCidr(cidr: Cidr, value: T): void {
		this._root = TreeNode.add(
			this._root,
			cidr.startIp.toInt(),
			31,
			31 - cidr.mask,
			value,
			this._merge
		);
	}

	contains(ipv4: IpV4): boolean {
		return this._root.contains(ipv4.toInt(), 31);
	}

	listCidr(): CidrValue<T>[] {
		const ret: CidrValue<T>[] = [];
		this._root.output(0, 31, (p, b, v) =>
			ret.push({ cidr: new Cidr(IpV4.fromInt(p), b), value: v })
		);
		return ret;
	}
}
