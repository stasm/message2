export abstract class SyntaxNode {
	abstract kind: string;
}

export class Message extends SyntaxNode {
	kind = "Message";
	locals: Array<Local> = [];
	selectors: Array<Expression> = [];
	variants: Array<Variant> = [];
}

export class Local extends SyntaxNode {
	kind = "Local";
	name: string;
	expr: Expression;

	constructor(name: string, expr: Expression) {
		super();
		this.name = name;
		this.expr = expr;
	}
}

export type VariantKey = Literal | Star;

export class Variant extends SyntaxNode {
	kind = "Variant";
	keys: Array<VariantKey>;
	value: Pattern;

	constructor(keys: Array<VariantKey>, value: Pattern) {
		super();
		this.keys = keys;
		this.value = value;
	}
}

export type Placeholder = Expression | MarkupOpen | MarkupClose;
export type PatternElement = Text | Placeholder;

export class Pattern extends SyntaxNode {
	kind = "Pattern";
	elements: Array<PatternElement>;

	constructor(elements: Array<PatternElement>) {
		super();
		this.elements = elements;
	}
}

export type Expression = OperandExpression | FunctionExpression;
export type ExpressionArgument = Literal | VariableReference;

export class OperandExpression extends SyntaxNode {
	kind = "OperandExpression";
	arg: ExpressionArgument;
	func: FunctionExpression | null;

	constructor(arg: ExpressionArgument, func: FunctionExpression | null) {
		super();
		this.arg = arg;
		this.func = func;
	}
}

export type OptionValue = Literal | VariableReference;
export type Options = Record<string, OptionValue>;

export class FunctionExpression extends SyntaxNode {
	kind = "FunctionExpression";
	name: string;
	opts: Options;

	constructor(name: string, opts: Options) {
		super();
		this.name = name;
		this.opts = opts;
	}
}

export class MarkupOpen extends SyntaxNode {
	kind = "MarkupOpen";
	name: string;
	opts: Options;

	constructor(name: string, opts: Options) {
		super();
		this.name = name;
		this.opts = opts;
	}
}

export class MarkupClose extends SyntaxNode {
	kind = "MarkupClose";
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class VariableReference extends SyntaxNode {
	kind = "VariableReference";
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class Text extends SyntaxNode {
	kind = "Text";
	value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Literal extends SyntaxNode {
	kind = "Literal";
	value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Star extends SyntaxNode {
	kind = "Star";
}
