import {Formattable, FormattingContext, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {EnglishNoun, PolishNoun} from "./noun.js";
import {RuntimeTerm, Term} from "./term.js";

export function format_adjective(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): Formattable {
	if (arg === null) {
		throw new TypeError();
	}

	switch (ctx.locale) {
		case "en":
			return format_adjective_en(ctx, arg, opts);
		case "pl":
			return format_adjective_pl(ctx, arg, opts);
		default:
			throw new RangeError("Locale not supported by :noun: " + ctx.locale);
	}
}

interface EnglishAdjectiveOptions {
	accord?: EnglishNoun;
}

export class EnglishAdjective implements RuntimeValue {
	canonical: string;
	values: Term;
	opts: EnglishAdjectiveOptions;

	constructor(term: Term, opts: EnglishAdjectiveOptions = {}) {
		this.canonical = term.canonical;
		this.values = {...term};
		this.opts = opts;
	}

	static from(other: EnglishAdjective, extend_opts?: EnglishAdjectiveOptions) {
		return new this(other.values, {
			...other.opts,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext) {
		return this.canonical;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {
			type: "adjective",
			value: this.formatToString(ctx),
		};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

function format_adjective_en(ctx: FormattingContext, arg: ast.Operand, opts: ast.Options): Formattable {
	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeTerm) {
		let term = arg_value.get_term(ctx);
		return new EnglishAdjective(term);
	}
	throw new TypeError();
}

interface PolishAdjectiveOptions {
	// https://unicode.org/reports/tr35/tr35-general.html#Case
	// grammatical_case?: "nominative" | "genitive" | "accusative";
	// grammatical_number?: "one" | "few" | "many";
	accord?: PolishNoun;
}

export class PolishAdjective implements RuntimeValue {
	canonical: string;
	values: Term;
	opts: PolishAdjectiveOptions;

	constructor(term: Term, opts: PolishAdjectiveOptions) {
		this.canonical = term.canonical;
		this.values = {...term};
		this.opts = opts;
	}

	static from(other: PolishNoun, extend_opts?: PolishAdjectiveOptions) {
		return new this(other.values, {
			...other.opts,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext) {
		if (this.opts.accord) {
			let accord_gender = this.opts.accord.gender ?? "inanimate";
			let accord_number = this.opts.accord.opts.grammatical_number;
			let accord_case = this.opts.accord.opts.grammatical_case;
			let variant_name = accord_gender + "_" + accord_number + "_" + accord_case;
			return this.values[variant_name] ?? this.canonical;
		}
		return this.canonical;
	}

	*formatToParts(ctx: FormattingContext) {
		let grammatical_gender: string;
		let grammatical_case: string;
		let grammatical_number: string;
		if (this.opts.accord) {
			grammatical_gender = this.opts.accord.gender;
			grammatical_case = this.opts.accord.opts.grammatical_case;
			grammatical_number = this.opts.accord.opts.grammatical_number;
		} else {
			grammatical_gender = "canonical";
			grammatical_case = "canonical";
			grammatical_number = "canonical";
		}

		yield {
			type: "adjective",
			value: this.formatToString(ctx),
			grammatical_gender,
			grammatical_case,
			grammatical_number,
		};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

function format_adjective_pl(ctx: FormattingContext, arg: ast.Operand, opts: ast.Options): Formattable {
	let resolved_opts: PolishAdjectiveOptions = {};
	if (opts.has("accord")) {
		let opt_value = ctx.resolveOperand(opts.get("accord"));
		if (opt_value instanceof PolishNoun) {
			resolved_opts.accord = opt_value;
		} else if (opt_value instanceof RuntimeTerm) {
			let term = opt_value.get_term(ctx);
			resolved_opts.accord = new PolishNoun(term);
		}
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeTerm) {
		let term = arg_value.get_term(ctx);
		return new PolishAdjective(term, resolved_opts);
	}
	throw new TypeError();
}
