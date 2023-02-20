export interface Message {
	lang: string;
	id: string;
	selectors: Array<Selector>;
	variants: Array<Variant>;
}

export interface Selector {
	expr: VariableReference | FunctionCall;
	default: StringLiteral;
}

export interface Variant {
	keys: Array<VariantKey>;
	value: Array<PatternElement>;
}

export type VariantKey = StringLiteral;
export type PatternElement = StringLiteral | VariableReference | FunctionCall;

export interface FunctionCall {
	type: "FunctionCall";
	name: string;
	args: Array<Argument>;
	opts: Record<string, Parameter>;
}

export interface VariableReference {
	type: "VariableReference";
	name: string;
}

export interface StringLiteral {
	type: "StringLiteral";
	value: string;
}

export type Argument = VariableReference | StringLiteral;
export type Parameter = VariableReference | StringLiteral;
