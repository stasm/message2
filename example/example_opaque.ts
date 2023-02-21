import {test} from "tap";
import {Message, StringLiteral} from "../impl/model.js";
import {FormattingContext, formatToParts, OpaquePart, RuntimeValue} from "../impl/runtime.js";

// We want to pass it into the translation and get it back out unformatted, in
// the correct position in the sentence, via formatToParts.
class SomeUnstringifiableClass {}

class WrappedValue implements RuntimeValue {
	public value: SomeUnstringifiableClass;

	constructor(value: SomeUnstringifiableClass) {
		this.value = value;
	}

	formatToString(ctx: FormattingContext): string {
		throw new Error("Method not implemented.");
	}

	*formatToParts(ctx: FormattingContext): Generator<OpaquePart> {
		yield {type: "opaque", value: this.value};
	}

	match(ctx: FormattingContext, key: StringLiteral) {
		return false;
	}
}

test("Pass an opaque instance as a variable", (tap) => {
	// "Ready? Then {$submitButton}!"
	let message: Message = {
		lang: "en",
		id: "submit",
		selectors: [],
		variants: [
			{
				keys: [],
				value: [
					{type: "StringLiteral", value: "Ready? Then  "},
					{
						type: "VariableReference",
						name: "submitButton",
					},
					{type: "StringLiteral", value: "!"},
				],
			},
		],
	};

	let instance = new SomeUnstringifiableClass();

	tap.same(
		formatToParts(message, {
			submitButton: new WrappedValue(instance),
		}),
		[
			{type: "literal", value: "Ready? Then  "},
			{type: "opaque", value: instance},
			{type: "literal", value: "!"},
		]
	);

	tap.end();
});
