import * as ast from "../syntax/ast.js";
import {FormatContext} from "./FormatContext.js";
import {RuntimeValue} from "./RuntimeValue.js";

export class RuntimeString implements RuntimeValue {
	public value: string;

	constructor(value: string) {
		this.value = value;
	}

	static from(other: RuntimeString) {
		return new this(other.value);
	}

	formatToString(ctx: FormatContext) {
		return this.value;
	}

	*formatToParts(ctx: FormatContext) {
		yield {type: "literal", value: this.value};
	}

	match(ctx: FormatContext, key: ast.Literal) {
		return this.value === key.value;
	}
}
