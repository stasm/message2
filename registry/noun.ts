import {FormatContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeNumber} from "./number.js";
import {RuntimeTerm, Term} from "./term.js";

export function format_noun(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeValue {
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

	formatToString(ctx: FormatContext) {
		let key = this.opts.grammatical_number + "_" + this.opts.grammatical_case;
		return this.values[key] ?? this.canonical;
	}

	*formatToParts(ctx: FormatContext) {
		yield {
			type: "noun",
			value: this.formatToString(ctx),
			grammatical_case: this.opts.grammatical_case,
			grammatical_number: this.opts.grammatical_number,
		};
	}

	match(ctx: FormatContext, key: ast.Literal) {
		return false;
	}
}

function format_noun_en(ctx: FormatContext, arg: RuntimeValue | null, opts: Map<string, RuntimeValue>): RuntimeValue {
	let explicit_opts: Partial<EnglishNounOptions> = {};
	if (opts.has("case")) {
		let opt_value = opts.get("case");
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "nominative" || opt_value.value === "genitive") {
				explicit_opts.grammatical_case = opt_value.value;
			}
		}
	}
	if (opts.has("number")) {
		let opt_value = opts.get("number");
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "one" || opt_value.value === "other") {
				explicit_opts.grammatical_number = opt_value.value;
			}
		}
	}

	if (arg instanceof EnglishNoun) {
		return EnglishNoun.from(arg, explicit_opts);
	} else if (arg instanceof RuntimeTerm) {
		let term = arg.get_term(ctx);
		return new EnglishNoun(term, explicit_opts);
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

	formatToString(ctx: FormatContext) {
		let key = this.opts.grammatical_number + "_" + this.opts.grammatical_case;
		return this.values[key] ?? this.canonical;
	}

	*formatToParts(ctx: FormatContext) {
		yield {
			type: "noun",
			value: this.formatToString(ctx),
			grammatical_case: this.opts.grammatical_case,
			grammatical_number: this.opts.grammatical_number,
		};
	}

	match(ctx: FormatContext, key: ast.Literal) {
		switch (this.opts.inspect_property) {
			case "gender":
				return this.gender === key.value;
			default:
				return false;
		}
	}
}

function format_noun_pl(ctx: FormatContext, arg: RuntimeValue | null, opts: Map<string, RuntimeValue>): RuntimeValue {
	let explicit_opts: Partial<PolishNounOptions> = {};
	if (opts.has("case")) {
		let opt_value = opts.get("case");
		if (opt_value instanceof RuntimeString) {
			if (
				opt_value.value === "nominative" ||
				opt_value.value === "genitive" ||
				opt_value.value === "accusative"
			) {
				explicit_opts.grammatical_case = opt_value.value;
			}
		}
	}
	if (opts.has("number")) {
		let opt_value = opts.get("number");
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "one" || opt_value.value === "few" || opt_value.value === "many") {
				explicit_opts.grammatical_number = opt_value.value;
			}
		} else if (opt_value instanceof RuntimeNumber) {
			let pr = new Intl.PluralRules(ctx.locale, {
				minimumIntegerDigits: opt_value.opts.minimumIntegerDigits,
				minimumFractionDigits: opt_value.opts.minimumFractionDigits,
				maximumFractionDigits: opt_value.opts.maximumFractionDigits,
				minimumSignificantDigits: opt_value.opts.minimumSignificantDigits,
				maximumSignificantDigits: opt_value.opts.maximumSignificantDigits,
				...explicit_opts,
			});
			let rule = pr.select(opt_value.value);
			if (rule === "one" || rule === "few" || rule === "many") {
				explicit_opts.grammatical_number = rule;
			}
		}
	}
	if (opts.has("inspect")) {
		let opt_value = opts.get("inspect");
		if (opt_value instanceof RuntimeString) {
			if (opt_value.value === "gender") {
				explicit_opts.inspect_property = opt_value.value;
			}
		}
	}

	if (arg instanceof PolishNoun) {
		return PolishNoun.from(arg, explicit_opts);
	} else if (arg instanceof RuntimeTerm) {
		let term = arg.get_term(ctx);
		return new PolishNoun(term, explicit_opts);
	}
	throw new TypeError();
}
