import {readFileSync} from "fs";
import {createInterface} from "readline";
import {Lexer} from "../syntax/Lexer.js";

function exit_help(exit_code) {
	console.log(`
    Tokenize a message and print its tokens.

        Usage: node lex.mjs [FILE]

        When FILE is not specified, read text from stdin.

    Examples:

        node lex.mjs path/to/file.txt
        node lex.mjs <(echo "{Hello, world!}")
        cat path/to/file.txt | node lex.mjs

    Options:

        -h, --help      Display help and quit.
`);
	process.exit(exit_code);
}

function main_stdin() {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "lexer>",
	});

	const lines = [];

	rl.on("line", (line) => lines.push(line));
	rl.on("close", () => main(lines.join("\n") + "\n"));
}

function main_file(file_path) {
	let content = readFileSync(file_path, "utf8");
	main(content);
}

function main(content) {
	let lexer = new Lexer(content);
	try {
		for (let token of lexer) {
			console.log(token);
		}
	} catch (e) {
		console.error(`
[${e.name} at ${e.start}-${e.end}] ${e.message}`);
		process.exit(2);
	}
}

let [$1] = process.argv.slice(2);
if ($1 === "-h" || $1 === "--help") {
	exit_help(1);
}

if ($1) {
	main_file($1);
} else {
	main_stdin();
}
