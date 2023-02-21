import {test} from "tap";
import {MessageFormat, RuntimeString} from "../impl/index.js";

test("String interpolation", (tap) => {
	let message = new MessageFormat("en-US", "{Hello, {$userName}!}");
	tap.equal(
		message.formatMessage({
			userName: new RuntimeString("Alice"),
		}),
		"Hello, Alice!"
	);
	tap.same(
		message.formatToParts({
			userName: new RuntimeString("Bob"),
		}),
		[
			{type: "literal", value: "Hello, "},
			{type: "literal", value: "Bob"},
			{type: "literal", value: "!"},
		]
	);
	tap.end();
});
