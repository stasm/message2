import {FormattingContext, Matchable, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

export class RuntimeNumber implements RuntimeValue {
	value: number;
	opts: Intl.NumberFormatOptions;

	constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	static from(other: RuntimeNumber, extend_opts?: Intl.NumberFormatOptions) {
		return new this(other.value, {
			...other.opts,
			...extend_opts,
		});
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

	let resolved_opts: Intl.NumberFormatOptions = {};
	if (opts.has("style")) {
		let value = ctx.resolveOperand(opts.get("style"));
		if (value instanceof RuntimeString) {
			resolved_opts.style = value.value;
		}
	}
	if (opts.has("unit")) {
		let value = ctx.resolveOperand(opts.get("unit"));
		if (value instanceof RuntimeString) {
			resolved_opts.unit = value.value;
		}
	}
	if (opts.has("minimumIntegerDigits")) {
		let value = ctx.resolveOperand(opts.get("minimumIntegerDigits"));
		if (value instanceof RuntimeString) {
			resolved_opts.minimumIntegerDigits = parseInt(value.value);
		}
	}
	if (opts.has("minimumFractionDigits")) {
		let value = ctx.resolveOperand(opts.get("minimumFractionDigits"));
		if (value instanceof RuntimeString) {
			resolved_opts.minimumFractionDigits = parseInt(value.value);
		}
	}
	if (opts.has("maximumFractionDigits")) {
		let value = ctx.resolveOperand(opts.get("maximumFractionDigits"));
		if (value instanceof RuntimeString) {
			resolved_opts.maximumFractionDigits = parseInt(value.value);
		}
	}
	if (opts.has("minimumSignificantDigits")) {
		let value = ctx.resolveOperand(opts.get("minimumSignificantDigits"));
		if (value instanceof RuntimeString) {
			resolved_opts.minimumSignificantDigits = parseInt(value.value);
		}
	}
	if (opts.has("maximumSignificantDigits")) {
		let value = ctx.resolveOperand(opts.get("maximumSignificantDigits"));
		if (value instanceof RuntimeString) {
			resolved_opts.maximumSignificantDigits = parseInt(value.value);
		}
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeNumber) {
		return RuntimeNumber.from(arg_value, resolved_opts);
	}
	if (arg_value instanceof RuntimeString) {
		let raw_value = parseInt(arg_value.value);
		return new RuntimeNumber(raw_value, resolved_opts);
	}
	throw new TypeError();
}

export class PluralMatcher implements Matchable {
	rule: Intl.LDMLPluralRule;
	number: number;

	constructor(rule: Intl.LDMLPluralRule, number: number) {
		this.rule = rule;
		this.number = number;
	}

	match(ctx: FormattingContext, key: ast.Literal): boolean {
		// Attempt an exact match on the numerical value first.
		return this.number === parseInt(key.value) || this.rule === key.value;
	}
}

export function match_plural(
	ctx: FormattingContext,
	arg: ast.Operand | null,
	opts: ast.Options
): Matchable {
	// TODO(stasm): Cache PluralRules.
	// TODO(stasm): Support other options.

	if (arg === null) {
		throw new TypeError();
	}

	let resolved_opts: Intl.PluralRulesOptions = {};
	if (opts.has("type")) {
		let type_value = ctx.resolveOperand(opts.get("type"));
		if (type_value instanceof RuntimeString) {
			// TODO(stasm): Validate type value.
			resolved_opts.type = type_value.value as Intl.PluralRuleType;
		}
		// TODO(stasm): Handle other types.
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeNumber) {
		let pr = new Intl.PluralRules(ctx.locale, {
			minimumIntegerDigits: arg_value.opts.minimumIntegerDigits,
			minimumFractionDigits: arg_value.opts.minimumFractionDigits,
			maximumFractionDigits: arg_value.opts.maximumFractionDigits,
			minimumSignificantDigits: arg_value.opts.minimumSignificantDigits,
			maximumSignificantDigits: arg_value.opts.maximumSignificantDigits,
			...resolved_opts,
		});
		let rule = pr.select(arg_value.value);
		return new PluralMatcher(rule, arg_value.value);
	}
	if (arg_value instanceof RuntimeString) {
		let num_value = parseInt(arg_value.value);
		let pr = new Intl.PluralRules(ctx.locale, resolved_opts);
		let category = pr.select(num_value);
		return new PluralMatcher(category, num_value);
	}
	throw new TypeError();
}
