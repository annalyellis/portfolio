# eʟᴏᴄuent

Node.js script to analyze lines of code in a (smallish) codebase and generate a CSV with stats about each line.
It works by running `git blame`, then parsing the output.

Originally written as a package for students of MIT’s Interactive visualization & Society course to use in one of the labs,
so it’s not very robust or flexible in the general case, but PRs are welcome.

## Installation

```bash
npm install elocuent
```

You can also install globally:

```bash
npm install -g elocuent
```

## Usage

Use all defaults:
```bash
npx elocuent
```

Use a custom glob for input
```bash
npx elocuent -i "src/**/*.js,!src/index.js"
```

Custom directory and file type (cannot be combined with `-i`/`--input`):
```bash
npx elocuent -d "src,static" -t "html,css,js,svelte"
```

Custom output file:
```bash
npx elocuent -o "loc.csv"
```

Spaces for indentation:
```bash
npx elocuent --spaces 2
```

### All CLI Options

| Option | Description | Default |
| --- | --- | --- |
| `-i`, `--input` | Glob pattern for input files |  |
| `-o`, `--output` | Output file path. Any directories need to exist or you’ll get an error. | `loc.csv` |
| `-d`, `--dir` | Comma-separated list of directories to search. **Will be ignored if `-i`/`--input` is present.** | `src` |
| `-t`, `--types` | Comma-separated list of file types to search. **Will be ignored if `-i`/`--input` is present.** | `html,css,js,svelte` |
| `-s`, `--spaces` | If using spaces for indentation, number of spaces to use | `false` (use tabs) |
| `--verbose` | Show verbose output |  |
| `--dry-run` | Do not write to file. Also enables verbose output |  |
| `--blame-out` | Path to a file to write the output of `git blame` to. Useful for debugging. |  |
| `-h`, `--help` | Show help |  |

## CSV Metadata

The metadata stored in the CSV is:

| Field | Description |
| --- | --- |
| `file` | The file the line is from |
| `line` | The line number |
| `type` | The type of code (`"html"`, `"css"`, `"js"`, `"svelte"`) |
| `commit` | The identifier *(SHA hash)* of the commit that last changed this line |
| `date` | The date the commit was made |
| `time` | The time the commit was made |
| `timezone` | The timezone the commit was made |
| `datetime` | The full date and time (including timezone) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format |
| `author` | The full name of the author of the last commit that changed this line |
| `depth` | The indentation level of the line |
| `length` | The number of characters in the line after trimming (i.e. excluding whitespace at the start and end) |

## JS API

You can also use eʟᴏᴄuent as a JS module:

```js
import elocuent from "elocuent";

elocuent({
	input: "src/**/*.js,!src/index.js",
	output: "loc.csv",
	spaces: 2
});
```