import {test} from "tap";
import {FormattingContext, MessageFormat, RuntimeValue} from "../runtime/index.js";
import * as ast from "../syntax/ast.js";

// We want to pass it into the translation and get it back out unformatted, in
// the correct position in the sentence, via formatToParts.
class UnstringifiableClass {}

class WrappedValue implements RuntimeValue {
	label = "<UnstringifiableClass>";
	value: UnstringifiableClass;

	constructor(value: UnstringifiableClass) {
		this.value = value;
	}

	formatToString(ctx: FormattingContext): string {
		return this.label;
	}

	*formatToParts(ctx: FormattingContext) {
		yield {type: "opaque", value: this.label, instance: this.value};
	}

	match(ctx: FormattingContext, key: ast.Literal) {
		return false;
	}
}

test("Pass an opaque instance as a variable", (tap) => {
	// "Ready? Then {$submitButton}!"
	let message = new MessageFormat("en-US", "{Ready? Then {$submitButton}!}");

	let instance = new UnstringifiableClass();

	tap.same(
		message.formatToParts({
			submitButton: new WrappedValue(instance),
		}),
		[
			{type: "literal", value: "Ready? Then "},
			{type: "opaque", value: "<UnstringifiableClass>", instance: instance},
			{type: "literal", value: "!"},
		]
	);

	tap.end();
});
