/* Atom - a context-free segment of the source.
 *
 * Atoms are generated internally by Lexer.#scan() as the first step towards the
 * lexing analysis. The source is segmented into Atoms based on whitespace and
 * special characters. No other information is taken into account; for example,
 * atoms have no knowledge of whether they are part of an expression or a pattern.
 */
export interface Atom {
	kind: "word" | "punctuator" | "whitespace" | "escape";
	value: string;
	start: number;
	end: number;
}

/* Split the input into atoms based on whitespace and special characters.
 */
export function* scan(source: string): Generator<Atom> {
	let start = 0;
	let cursor = 0;
	let kind: Atom["kind"] = "punctuator";
	let value: string = "";
	for (let char of source) {
		if (kind === "escape") {
			yield {kind, value: "\\" + char, start, end: cursor};
			kind = "punctuator";
			value = "";
			continue;
		}
		switch (char) {
			case "\t":
			case "\r":
			case "\n":
			case " ":
				if (kind === "whitespace") {
					value += char;
					break;
				}
				if (value) {
					yield {kind, value, start, end: cursor};
				}
				kind = "whitespace";
				value = char;
				start = cursor;
				break;
			case "{":
			case "}":
			case "=":
			case "*":
			case "(":
			case ")":
				if (value) {
					yield {kind, value, start, end: cursor};
				}
				kind = "punctuator";
				value = char;
				start = cursor;
				break;
			case "\\":
				if (value) {
					yield {kind, value, start, end: cursor};
				}
				kind = "escape";
				start = cursor;
				break;
			default:
				if (kind === "word") {
					value += char;
					break;
				}
				if (value) {
					yield {kind, value, start, end: cursor};
				}
				kind = "word";
				value = char;
				start = cursor;
		}
		cursor++;
	}

	if (value) {
		yield {kind, value, start, end: cursor};
	}
}
