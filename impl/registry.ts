import {FormattingContext} from "./FormattingContext.js";
import {Argument, Parameter, VariantKey} from "./model.js";
import {RuntimeString} from "./RuntimeString.js";
import {Formattable, Matchable, RuntimeValue} from "./RuntimeValue.js";

export type FormattingFunc = (
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
) => Formattable;

export type MatchingFunc = (
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
) => Matchable;

// The built-in matching functions.
export const REGISTRY_MATCH: Record<string, MatchingFunc> = {
	CHOOSE: select_choose,
	PLURAL: select_plural,
};

function select_choose(
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
): Matchable {
	let value = ctx.toRuntimeValue(args[0]);

	if (value instanceof RuntimeString) {
		return value;
	}

	throw new TypeError();
}

export class MatchablePlural implements Matchable {
	public value: Intl.LDMLPluralRule;
	public count: number;

	constructor(value: Intl.LDMLPluralRule, count: number) {
		this.value = value;
		this.count = count;
	}

	match(ctx: FormattingContext, key: VariantKey): boolean {
		return this.value === key.value;
	}
}

function select_plural(
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
): Matchable {
	let count = ctx.toRuntimeValue(args[0]);
	if (!(count instanceof RuntimeString)) {
		throw new TypeError();
	}

	let value = parseInt(count.value);

	// TODO(stasm): Cache PluralRules.
	let pr = new Intl.PluralRules(ctx.locale);
	let category = pr.select(value);
	return new MatchablePlural(category, value);
}

// The built-in formatting functions.
export const REGISTRY_FORMAT: Record<string, FormattingFunc> = {
	NUMBER: format_number,
};
export class RuntimeNumber implements RuntimeValue {
	public value: number;
	private opts: Intl.NumberFormatOptions;

	constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	formatToString(ctx: FormattingContext) {
		// TODO(stasm): Cache NumberFormat.
		return new Intl.NumberFormat(ctx.locale, this.opts).format(this.value);
	}

	*formatToParts(ctx: FormattingContext) {
		yield* new Intl.NumberFormat(ctx.locale, this.opts).formatToParts(this.value);
	}

	match(ctx: FormattingContext, key: VariantKey) {
		return this.value === parseInt(key.value);
	}
}

function format_number(
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
): RuntimeNumber {
	let number = ctx.toRuntimeValue(args[0]);
	if (!(number instanceof RuntimeString)) {
		throw new TypeError();
	}

	let value = parseInt(number.value);

	// TODO(stasm): Add more options.
	let opt_values: Record<string, boolean | number | string> = {};
	if ("STYLE" in opts) {
		let value = ctx.toRuntimeValue(opts["STYLE"]);
		if (value instanceof RuntimeString) {
			opt_values["style"] = value.value;
		}
	}
	if ("UNIT" in opts) {
		let value = ctx.toRuntimeValue(opts["UNIT"]);
		if (value instanceof RuntimeString) {
			opt_values["unit"] = value.value;
		}
	}

	return new RuntimeNumber(value, opt_values);
}
