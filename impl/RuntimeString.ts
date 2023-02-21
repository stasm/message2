import {FormattingContext} from "./FormattingContext.js";
import {VariantKey} from "./model.js";
import {RuntimeValue} from "./RuntimeValue.js";

export class RuntimeString implements RuntimeValue {
	public value: string;

	constructor(value: string) {
		this.value = value;
	}

	formatToString(ctx: FormattingContext) {
		return this.value;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {type: "literal", value: this.value};
	}

	match(ctx: FormattingContext, key: VariantKey) {
		return this.value === key.value;
	}
}
