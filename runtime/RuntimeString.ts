import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {RuntimeValue} from "./RuntimeValue.js";

export class RuntimeString implements RuntimeValue {
	public value: string;

	constructor(value: string) {
		this.value = value;
	}

	static from(other: RuntimeString) {
		return new this(other.value);
	}

	formatToString(ctx: FormattingContext) {
		return this.value;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {type: "literal", value: this.value};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return this.value === key.value;
	}
}
