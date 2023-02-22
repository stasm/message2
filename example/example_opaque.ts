import {test} from "tap";
import {FormattingContext, MessageFormat, OpaquePart, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

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

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

test("Pass an opaque instance as a variable", (tap) => {
	// "Ready? Then {$submitButton}!"
	let message = new MessageFormat("en-US", "{Ready? Then {$submitButton}!}");

	let instance = new SomeUnstringifiableClass();

	tap.same(
		message.formatToParts({
			submitButton: new WrappedValue(instance),
		}),
		[
			{type: "literal", value: "Ready? Then "},
			{type: "opaque", value: instance},
			{type: "literal", value: "!"},
		]
	);

	tap.end();
});
