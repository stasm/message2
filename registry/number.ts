import {FormatContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
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

	formatToString(ctx: FormatContext) {
		// TODO(stasm): Cache NumberFormat.
		return new Intl.NumberFormat(ctx.locale, this.opts).format(this.value);
	}

	*formatToParts(ctx: FormatContext) {
		yield* new Intl.NumberFormat(ctx.locale, this.opts).formatToParts(this.value);
	}

	match(ctx: FormatContext, key: ast.Literal) {
		return this.value === parseFloat(key.value);
	}
}

export function format_number(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeNumber {
	let explicit_opts: Intl.NumberFormatOptions = {};
	if (opts.has("style")) {
		let value = opts.get("style");
		if (value instanceof RuntimeString) {
			explicit_opts.style = value.value;
		}
	}
	if (opts.has("unit")) {
		let value = opts.get("unit");
		if (value instanceof RuntimeString) {
			explicit_opts.unit = value.value;
		}
	}
	if (opts.has("minimumIntegerDigits")) {
		let value = opts.get("minimumIntegerDigits");
		if (value instanceof RuntimeString) {
			explicit_opts.minimumIntegerDigits = parseInt(value.value);
		}
	}
	if (opts.has("minimumFractionDigits")) {
		let value = opts.get("minimumFractionDigits");
		if (value instanceof RuntimeString) {
			explicit_opts.minimumFractionDigits = parseInt(value.value);
		}
	}
	if (opts.has("maximumFractionDigits")) {
		let value = opts.get("maximumFractionDigits");
		if (value instanceof RuntimeString) {
			explicit_opts.maximumFractionDigits = parseInt(value.value);
		}
	}
	if (opts.has("minimumSignificantDigits")) {
		let value = opts.get("minimumSignificantDigits");
		if (value instanceof RuntimeString) {
			explicit_opts.minimumSignificantDigits = parseInt(value.value);
		}
	}
	if (opts.has("maximumSignificantDigits")) {
		let value = opts.get("maximumSignificantDigits");
		if (value instanceof RuntimeString) {
			explicit_opts.maximumSignificantDigits = parseInt(value.value);
		}
	}

	if (arg instanceof RuntimeNumber) {
		return RuntimeNumber.from(arg, explicit_opts);
	}
	if (arg instanceof RuntimeString) {
		let raw_value = parseFloat(arg.value);
		return new RuntimeNumber(raw_value, explicit_opts);
	}
	throw new TypeError();
}
