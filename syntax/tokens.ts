export abstract class Token {
	abstract kind: string;
	value: string;

	constructor(value: string) {
		this.value = value;
	}
}

export class Keyword extends Token {
	kind = "keyword";
}

export class VariableName extends Token {
	kind = "variable_name";
}

export class FunctionName extends Token {
	kind = "function_name";
}

export class MarkupStart extends Token {
	kind = "markup_start";
}

export class MarkupEnd extends Token {
	kind = "markup_end";
}

export class Name extends Token {
	kind = "name";
}

export class Nmtoken extends Token {
	kind = "nmtoken";
}

export class Literal extends Token {
	kind = "literal";
}

export class Star extends Token {
	kind = "star";
}

export class Text extends Token {
	kind = "text";
}

export class Punctuator extends Token {
	kind = "punctuator";
}

export class Whitespace extends Token {
	kind = "whitespace";
}
