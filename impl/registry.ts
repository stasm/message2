import {Formattable, FormattableNumber} from "./Formattable.js";
import {FormattingContext} from "./FormattingContext.js";
import {Matchable, MatchableNumber, MatchablePlural, MatchableString} from "./Matchable.js";
import {Argument, Parameter} from "./model.js";
import {RuntimeNumber, RuntimeString} from "./RuntimeValue.js";

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
	if (value instanceof RuntimeNumber) {
		return new MatchableNumber(value.value);
	}

	if (value instanceof RuntimeString) {
		return new MatchableString(value.value);
	}

	throw new TypeError();
}

function select_plural(
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
): Matchable {
	let count = ctx.toRuntimeValue(args[0]);
	if (!(count instanceof RuntimeNumber)) {
		throw new TypeError();
	}

	// TODO(stasm): Cache PluralRules.
	let pr = new Intl.PluralRules(ctx.locale);
	let category = pr.select(count.value);
	return new MatchablePlural(category, count.value);
}

// The built-in formatting functions.
export const REGISTRY_FORMAT: Record<string, FormattingFunc> = {
	NUMBER: format_number,
};

function format_number(
	ctx: FormattingContext,
	args: Array<Argument>,
	opts: Record<string, Parameter>
): FormattableNumber {
	let number = ctx.toRuntimeValue(args[0]);
	if (!(number instanceof RuntimeNumber)) {
		throw new TypeError();
	}

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

	return new FormattableNumber(number.value, opt_values);
}
