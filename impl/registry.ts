import * as ast from "../syntax/ast.js";
import {FormattingContext} from "./FormattingContext.js";
import {RuntimeString} from "./RuntimeString.js";
import {Formattable, Matchable, RuntimeValue} from "./RuntimeValue.js";

export type FormattingFunc = (
	ctx: FormattingContext,
	arg: ast.ExpressionOperand | null,
	opts: ast.Options
) => Formattable;

export type MatchingFunc = (
	ctx: FormattingContext,
	arg: ast.ExpressionOperand | null,
	opts: ast.Options
) => Matchable;

// The built-in matching functions.
export const REGISTRY_MATCH: Record<string, MatchingFunc> = {
	choose: select_choose,
	plural: select_plural,
};

function select_choose(
	ctx: FormattingContext,
	arg: ast.ExpressionOperand | null,
	opts: ast.Options
): Matchable {
	if (arg === null) {
		throw new TypeError();
	}

	let value = ctx.toRuntimeValue(arg);
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

	match(ctx: FormattingContext, key: ast.Literal): boolean {
		return this.value === key.value;
	}
}

function select_plural(
	ctx: FormattingContext,
	arg: ast.ExpressionOperand | null,
	opts: ast.Options
): Matchable {
	if (arg === null) {
		throw new TypeError();
	}

	let count = ctx.toRuntimeValue(arg);
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
	number: format_number,
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

	match(ctx: FormattingContext, key: ast.Literal) {
		return this.value === parseInt(key.value);
	}
}

function format_number(
	ctx: FormattingContext,
	arg: ast.ExpressionOperand | null,
	opts: ast.Options
): RuntimeNumber {
	if (arg === null) {
		throw new TypeError();
	}

	let argval = ctx.toRuntimeValue(arg);
	let value: number;
	if (argval instanceof RuntimeNumber) {
		value = argval.value;
	} else if (argval instanceof RuntimeString) {
		value = parseInt(argval.value);
	} else {
		throw new TypeError();
	}

	// TODO(stasm): Add more options.
	let opt_values: Record<string, boolean | number | string> = {};
	if ("style" in opts) {
		let value = ctx.toRuntimeValue(opts["style"]);
		if (value instanceof RuntimeString) {
			opt_values["style"] = value.value;
		}
	}
	if ("unit" in opts) {
		let value = ctx.toRuntimeValue(opts["unit"]);
		if (value instanceof RuntimeString) {
			opt_values["unit"] = value.value;
		}
	}

	return new RuntimeNumber(value, opt_values);
}
