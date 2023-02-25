import {FormattingContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeNumber} from "./number.js";
import {RuntimeTerm, Term} from "./term.js";

export function format_noun(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): RuntimeValue {
	if (arg === null) {
		throw new TypeError();
	}

	switch (ctx.locale) {
		case "en":
			return format_noun_en(ctx, arg, opts);
		case "pl":
			return format_noun_pl(ctx, arg, opts);
		default:
			throw new RangeError("Locale not supported by :noun: " + ctx.locale);
	}
}

interface EnglishNounOptions {
	// https://unicode.org/reports/tr35/tr35-general.html#Case
	grammatical_case: "nominative" | "genitive";
	grammatical_number: "one" | "other";
}

export class EnglishNoun implements RuntimeValue {
	canonical: string;
	values: Term;
	opts: EnglishNounOptions;

	constructor(term: Term, opts?: Partial<EnglishNounOptions>) {
		this.canonical = term.canonical;
		this.values = {...term};
		this.opts = {
			grammatical_case: "nominative",
			grammatical_number: "one",
			...opts,
		};
	}

	static from(other: EnglishNoun, extend_opts?: Partial<EnglishNounOptions>) {
		return new this(other.values, {
			...other.opts,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext) {
		let key = this.opts.grammatical_number + "_" + this.opts.grammatical_case;
		return this.values[key] ?? this.canonical;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {
			type: "noun",
			value: this.formatToString(ctx),
			grammatical_case: this.opts.grammatical_case,
			grammatical_number: this.opts.grammatical_number,
		};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

function format_noun_en(ctx: FormattingContext, arg: ast.Operand, opts: ast.Options): RuntimeValue {
	let resolved_opts: Partial<EnglishNounOptions> = {};
	if (opts.has("case")) {
		let opt_value = ctx.resolveOperand(opts.get("case"));
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "nominative" || opt_value.value === "genitive") {
				resolved_opts.grammatical_case = opt_value.value;
			}
		}
	}
	if (opts.has("number")) {
		let opt_value = ctx.resolveOperand(opts.get("number"));
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "one" || opt_value.value === "other") {
				resolved_opts.grammatical_number = opt_value.value;
			}
		}
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof EnglishNoun) {
		return EnglishNoun.from(arg_value, resolved_opts);
	} else if (arg_value instanceof RuntimeTerm) {
		let term = arg_value.get_term(ctx);
		return new EnglishNoun(term, resolved_opts);
	}
	throw new TypeError();
}

interface PolishNounOptions {
	// https://unicode.org/reports/tr35/tr35-general.html#Case
	// Omit dative, instrumental, locative, and vocative for the sake of the example.
	grammatical_case: "nominative" | "genitive" | "accusative";
	grammatical_number: "one" | "few" | "many";
	// Which field to match when the noun is used as a selector?
	inspect_property: null | "gender";
}

export class PolishNoun implements RuntimeValue {
	canonical: string;
	gender: string;
	values: Term;
	opts: PolishNounOptions;

	constructor(term: Term, opts?: Partial<PolishNounOptions>) {
		this.canonical = term.canonical;
		this.gender = term.gender;
		this.values = {...term};
		this.opts = {
			grammatical_case: "nominative",
			grammatical_number: "one",
			inspect_property: null,
			...opts,
		};
	}

	static from(other: PolishNoun, extend_opts?: Partial<PolishNounOptions>) {
		return new this(other.values, {
			...other.opts,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext) {
		let key = this.opts.grammatical_number + "_" + this.opts.grammatical_case;
		return this.values[key] ?? this.canonical;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {
			type: "noun",
			value: this.formatToString(ctx),
			grammatical_case: this.opts.grammatical_case,
			grammatical_number: this.opts.grammatical_number,
		};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		switch (this.opts.inspect_property) {
			case "gender":
				return this.gender === key.value;
			default:
				return false;
		}
	}
}

function format_noun_pl(ctx: FormattingContext, arg: ast.Operand, opts: ast.Options): RuntimeValue {
	let resolved_opts: Partial<PolishNounOptions> = {};
	if (opts.has("case")) {
		let opt_value = ctx.resolveOperand(opts.get("case"));
		if (opt_value instanceof RuntimeString) {
			if (
				opt_value.value === "nominative" ||
				opt_value.value === "genitive" ||
				opt_value.value === "accusative"
			) {
				resolved_opts.grammatical_case = opt_value.value;
			}
		}
	}
	if (opts.has("number")) {
		let opt_value = ctx.resolveOperand(opts.get("number"));
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "one" || opt_value.value === "few" || opt_value.value === "many") {
				resolved_opts.grammatical_number = opt_value.value;
			}
		} else if (opt_value instanceof RuntimeNumber) {
			let pr = new Intl.PluralRules(ctx.locale, {
				minimumIntegerDigits: opt_value.opts.minimumIntegerDigits,
				minimumFractionDigits: opt_value.opts.minimumFractionDigits,
				maximumFractionDigits: opt_value.opts.maximumFractionDigits,
				minimumSignificantDigits: opt_value.opts.minimumSignificantDigits,
				maximumSignificantDigits: opt_value.opts.maximumSignificantDigits,
				...resolved_opts,
			});
			let rule = pr.select(opt_value.value);
			if (rule === "one" || rule === "few" || rule === "many") {
				resolved_opts.grammatical_number = rule;
			}
		}
	}
	if (opts.has("inspect")) {
		let opt_value = ctx.resolveOperand(opts.get("inspect"));
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "gender") {
				resolved_opts.inspect_property = opt_value.value;
			}
		}
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof PolishNoun) {
		return PolishNoun.from(arg_value, resolved_opts);
	} else if (arg_value instanceof RuntimeTerm) {
		let term = arg_value.get_term(ctx);
		return new PolishNoun(term, resolved_opts);
	}
	throw new TypeError();
}
