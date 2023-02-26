import {FormatContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimePlural} from "./plural.js";

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

	formatToString(ctx: FormatContext) {
		// TODO(stasm): Cache ListFormat.
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		return lf.format(this.value.map((x) => x.formatToString(ctx)));
	}

	*formatToParts(ctx: FormatContext) {
		let lf = new Intl.ListFormat(ctx.locale, this.opts);
		yield* lf.formatToParts(this.value.map((x) => x.formatToString(ctx)));
	}

	match(ctx: FormatContext, key: ast.Literal) {
		return false;
	}
}

export function match_length(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeValue {
	if (arg instanceof RuntimeList) {
		return new RuntimePlural(arg.value.length);
	}
	throw new TypeError();
}

export function format_list(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeList {
	let explicit_opts: Intl.ListFormatOptions = {};
	if (opts.has("style")) {
		let value = opts.get("style");
		if (value instanceof RuntimeString) {
			if (value.value === "long" || value.value === "short" || value.value === "narrow") {
				explicit_opts.style = value.value;
			}
		}
	}
	if (opts.has("type")) {
		let value = opts.get("type");
		if (value instanceof RuntimeString) {
			if (value.value === "conjunction" || value.value === "disjunction" || value.value === "unit") {
				explicit_opts.type = value.value;
			}
		}
	}

	if (arg instanceof RuntimeList) {
		return RuntimeList.from(arg, explicit_opts);
	}
	if (arg instanceof RuntimeString) {
		return new RuntimeList([arg], explicit_opts);
	}
	throw new TypeError();
}
