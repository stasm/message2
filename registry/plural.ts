import {FormatContext, RuntimeString, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";
import {RuntimeNumber} from "./number.js";

export class RuntimePlural implements RuntimeValue {
	value: number;
	opts: Intl.PluralRulesOptions;

	constructor(value: number, opts: Intl.PluralRulesOptions = {}) {
		this.value = value;
		this.opts = opts;
	}

	static from(other: RuntimePlural, extend_opts?: Intl.PluralRulesOptions) {
		return new this(other.value, {
			...other.opts,
			...extend_opts,
		});
	}

	static fromNumber(other: RuntimeNumber, extend_opts?: Intl.PluralRulesOptions) {
		return new this(other.value, {
			minimumIntegerDigits: other.opts.minimumIntegerDigits,
			minimumFractionDigits: other.opts.minimumFractionDigits,
			maximumFractionDigits: other.opts.maximumFractionDigits,
			minimumSignificantDigits: other.opts.minimumSignificantDigits,
			maximumSignificantDigits: other.opts.maximumSignificantDigits,
			...extend_opts,
		});
	}

	formatToString(ctx: FormatContext): string {
		throw new EvalError("Cannot use :plural for formatting.");
	}

	*formatToParts(ctx: FormatContext) {
		throw new EvalError("Cannot use :plural for formatting.");
	}

	match(ctx: FormatContext, key: ast.Literal) {
		// Attempt an exact match on the numerical value first.
		if (this.value === parseFloat(key.value)) {
			return true;
		}
		let pr = new Intl.PluralRules(ctx.locale, this.opts);
		return pr.select(this.value) === key.value;
	}
}

export function match_plural(
	ctx: FormatContext,
	arg: RuntimeValue | null,
	opts: Map<string, RuntimeValue>
): RuntimeValue {
	let explicit_opts: Intl.PluralRulesOptions = {};
	if (opts.has("type")) {
		let type_value = opts.get("type");
		if (type_value instanceof RuntimeString) {
			// TODO(stasm): Validate type value.
			explicit_opts.type = type_value.value as Intl.PluralRuleType;
		}
		// TODO(stasm): Handle other types.
	}

	if (arg instanceof RuntimeNumber) {
		return RuntimePlural.fromNumber(arg, explicit_opts);
	}
	if (arg instanceof RuntimeString) {
		let num_value = parseFloat(arg.value);
		return new RuntimePlural(num_value, explicit_opts);
	}
	throw new TypeError();
}
