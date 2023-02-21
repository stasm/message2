import {test} from "tap";
import {Message} from "../impl/model.js";
import {formatMessage, formatToParts, RuntimeString} from "../impl/runtime.js";

test("String interpolation", (tap) => {
	// "Hello, {$userName}!"
	let message: Message = {
		lang: "en",
		id: "transferred",
		selectors: [],
		variants: [
			{
				keys: [],
				value: [
					{type: "StringLiteral", value: "Hello, "},
					{
						type: "VariableReference",
						name: "userName",
					},
					{type: "StringLiteral", value: "!"},
				],
			},
		],
	};

	tap.equal(
		formatMessage(message, {
			userName: new RuntimeString("Alice"),
		}),
		"Hello, Alice!"
	);

	tap.same(
		formatToParts(message, {
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
