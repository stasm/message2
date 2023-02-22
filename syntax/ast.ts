export abstract class SyntaxNode {
	abstract kind: string;
}

export class Message extends SyntaxNode {
	kind = "Message" as const;
	locals: Array<Local> = [];
	selectors: Array<Expression> = [];
	variants: Array<Variant> = [];
}

export class Local extends SyntaxNode {
	kind = "Local" as const;
	name: string;
	expr: Expression;

	constructor(name: string, expr: Expression) {
		super();
		this.name = name;
		this.expr = expr;
	}
}

export class Variant extends SyntaxNode {
	kind = "Variant" as const;
	keys: Array<VariantKey>;
	pattern: Pattern;

	constructor(keys: Array<VariantKey>, pattern: Pattern) {
		super();
		this.keys = keys;
		this.pattern = pattern;
	}
}

export type VariantKey = Literal | Star;

export type Pattern = Array<PatternElement>;

export type PatternElement = Text | Placeholder;

export type Placeholder = Expression | MarkupOpen | MarkupClose;

export type Expression = OperandExpression | FunctionExpression;

export class OperandExpression extends SyntaxNode {
	kind = "OperandExpression" as const;
	arg: Operand;
	func: FunctionExpression | null;

	constructor(arg: Operand, func: FunctionExpression | null) {
		super();
		this.arg = arg;
		this.func = func;
	}
}

export type Operand = Literal | VariableReference;

export class FunctionExpression extends SyntaxNode {
	kind = "FunctionExpression" as const;
	name: string;
	opts: Options;

	constructor(name: string, opts: Options) {
		super();
		this.name = name;
		this.opts = opts;
	}
}

export type Options = Map<string, Operand>;

export class MarkupOpen extends SyntaxNode {
	kind = "MarkupOpen" as const;
	name: string;
	opts: Options;

	constructor(name: string, opts: Options) {
		super();
		this.name = name;
		this.opts = opts;
	}
}

export class MarkupClose extends SyntaxNode {
	kind = "MarkupClose" as const;
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class VariableReference extends SyntaxNode {
	kind = "VariableReference" as const;
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class Text extends SyntaxNode {
	kind = "Text" as const;
	value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Literal extends SyntaxNode {
	kind = "Literal" as const;
	value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class Star extends SyntaxNode {
	kind = "Star" as const;
}
