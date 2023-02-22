import {FormattingContext, Matchable, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

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

export function format_number(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): RuntimeNumber {
	if (arg === null) {
		throw new TypeError();
	}
	let raw_value: number;
	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeString) {
		raw_value = parseInt(arg_value.value);
	} else if (arg_value instanceof RuntimeNumber) {
		raw_value = arg_value.value;
	} else {
		throw new TypeError();
	}

	// TODO(stasm): Add more options.
	let opt_values: Record<string, boolean | number | string> = {};
	if (opts.has("style")) {
		let value = ctx.resolveOperand(opts.get("style"));
		if (value instanceof RuntimeString) {
			opt_values["style"] = value.value;
		}
	}
	if (opts.has("unit")) {
		let value = ctx.resolveOperand(opts.get("unit"));
		if (value instanceof RuntimeString) {
			opt_values["unit"] = value.value;
		}
	}

	return new RuntimeNumber(raw_value, opt_values);
}

export class PluralMatcher implements Matchable {
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

export function match_plural(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Matchable {
	if (arg === null) {
		throw new TypeError();
	}
	let raw_value: number;
	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeString) {
		raw_value = parseInt(arg_value.value);
	} else if (arg_value instanceof RuntimeNumber) {
		raw_value = arg_value.value;
	} else {
		throw new TypeError();
	}

	// TODO(stasm): Cache PluralRules.
	let pr = new Intl.PluralRules(ctx.locale);
	let category = pr.select(raw_value);
	return new PluralMatcher(category, raw_value);
}
