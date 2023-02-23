import {FormattingContext, Matchable, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {PluralMatcher} from "./number.js";

export class RuntimeList implements RuntimeValue {
	value: Array<RuntimeValue>;
	opts: Intl.ListFormatOptions;

	constructor(value: Array<RuntimeValue>, opts: Intl.ListFormatOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	static from(other: RuntimeList, extend_opts?: Intl.ListFormatOptions) {
		return new this(other.value, {
			...other.opts,
			...extend_opts,
		});
	}

	formatToString(ctx: FormattingContext) {
		// TODO(stasm): Cache ListFormat.
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		return lf.format(this.value.map((x) => x.formatToString(ctx)));
	}

	*formatToParts(ctx: FormattingContext) {
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		yield* lf.formatToParts(this.value.map((x) => x.formatToString(ctx)));
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

export function match_length(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): Matchable {
	if (arg === null) {
		throw new TypeError();
	}
	let elements = ctx.resolveOperand(arg);
	if (elements instanceof RuntimeList) {
		// TODO(stasm): Cache PluralRules.
		let pr = new Intl.PluralRules(ctx.locale);
		let category = pr.select(elements.value.length);
		return new PluralMatcher(category, elements.value.length);
	}
	throw new TypeError();
}

export function format_list(ctx: FormattingContext, arg: ast.Operand | null, opts: ast.Options): RuntimeList {
	if (arg === null) {
		throw new TypeError();
	}

	let resolved_opts: Intl.ListFormatOptions = {};
	if (opts.has("style")) {
		let value = ctx.resolveOperand(opts.get("style"));
		if (value instanceof RuntimeString) {
			if (value.value === "long" || value.value === "short" || value.value === "narrow") {
				resolved_opts.style = value.value;
			}
		}
	}
	if (opts.has("type")) {
		let value = ctx.resolveOperand(opts.get("type"));
		if (value instanceof RuntimeString) {
			if (value.value === "conjunction" || value.value === "disjunction" || value.value === "unit") {
				resolved_opts.type = value.value;
			}
		}
	}

	let arg_value = ctx.resolveOperand(arg);
	if (arg_value instanceof RuntimeList) {
		return RuntimeList.from(arg_value, resolved_opts);
	}
	if (arg_value instanceof RuntimeString) {
		return new RuntimeList([arg_value], resolved_opts);
	}
	throw new TypeError();
}
