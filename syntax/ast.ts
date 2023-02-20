export interface Message {
	locals: Array<Local>;
	selectors: Array<Expression>;
	variants: Array<Variant>;
}

export interface Local {
	type: "Local";
	name: string;
	expr: Expression;
}

export interface Variant {
	type: "Variant";
	keys: Array<Literal | Star>;
	value: Pattern;
}

export interface Pattern {
	elements: Array<Text | Expression>;
}

export type Expression = OperandExpression | FunctionExpression;

export interface OperandExpression {
	type: "OperandExpression";
	arg: Literal | VariableReference;
	func: FunctionExpression | null;
}

export interface FunctionExpression {
	type: "FunctionExpression";
	name: string;
	opts: Record<string, Literal | VariableReference>;
}

export interface VariableReference {
	type: "VariableReference";
	name: string;
}

export interface Text {
	type: "Text";
	value: string;
}

export interface Literal {
	type: "Literal";
	value: string;
}

export interface Star {
	type: "Star";
}
