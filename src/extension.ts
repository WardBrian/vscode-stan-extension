
import * as vscode from "vscode";
import { Hunk, ParsedDiff, createPatch, parsePatch } from "diff";

export let registration: vscode.Disposable | undefined;

let logger = vscode.window.createOutputChannel("Stan Formatting")


type StancFunction = (filename: string, code: string, options: string[]) => { errors?: string[], result?: string };

import stancjs = require("./stanc.js");
const stanc: StancFunction = stancjs;
logger.appendLine("Loaded stanc.js")


function callStan(filename: string, code: string): { errors?: string[], result: string } | { errors?: string[], result?: string } {
    const lineLength = vscode.workspace.getConfiguration("stan-vscode.format").get<number>("lineLength") ?? 78;
    const args = [
        "auto-format",
        `filename-in-msg=${filename}`,
        `max-line-length=${lineLength}`,
        "canonicalze=deprecations",
        "allow-undefined",
    ]
    return stanc(filename, code, args);
}


/**
 * Handle an error raised by `promiseExec`, which passes an exception object.
 *
 * @param err The error raised by `promiseExec`, which would have been run to
 * execute the format command.
 */
export async function alertFormattingError(
    errors: string[]
): Promise<void> {

    const message = errors.join("\n");
    logger.appendLine(message);

    if (message.includes("Syntax") || message.includes("Semantic")) {
        const outputButton = "Show Output";
        const response = await vscode.window.showErrorMessage(
            "Stan formatting failed due to an error in your program",
            outputButton
        );
        if (response === outputButton) {
            logger.show(true);
            logger.clear();
            logger.appendLine(message);
        }
    } else {
        const bugReportButton = "Submit Bug Report";
        const response = await vscode.window.showErrorMessage(
            `Unknown Error: Could not format Stan file. Full error:\n\n${message}`,
            bugReportButton
        );
        if (response === bugReportButton) {
            vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.parse(
                    "https://github.com/wardbrian/stan-vscode/issues/new"
                )
            );
        }
    }
}

/**
 * Format a file using Docformatter and return the edit hunks without
 * modifying the file.
 * @param path Full path to a file to format.
 * @returns A promise that resolves to the edit hunks, which can then be
 * converted to edits and applied to the file. If the promise rejects, will
 * automatically show an error message to the user.
 */
export async function formatFile(document: vscode.TextDocument): Promise<Hunk[]> {


    const code = document.getText();
    const fileName = document.fileName;
    const { errors, result } = callStan(fileName, code);

    if (errors) {
        alertFormattingError(errors);
        throw new Error("Formatting failed: " + errors.join("\n"));
    }
    if (!result) {
        throw new Error("Formatting failed: no result returned");
    }
    const patch = createPatch(fileName, code, result);
    const parsed: ParsedDiff[] = parsePatch(patch);
    return parsed[0].hunks;
}


/**
 * Convert any number of hunks to a matching array of native VSCode edits.
 * @param hunks Array of hunks to convert to edits.
 * @returns Array of VSCode text edits, which map directly to the input hunks.
 */
export function hunksToEdits(hunks: Hunk[]): vscode.TextEdit[] {
    return hunks.map((hunk): vscode.TextEdit => {
        const startPos = new vscode.Position(hunk.oldStart - 1, 0)
        const endPos = new vscode.Position(hunk.oldStart - 1 + hunk.oldLines, 0)
        const editRange = new vscode.Range(startPos, endPos)

        const newTextFragments: string[] = []
        hunk.lines.forEach((line, i) => {
            const firstChar = line.charAt(0)
            if (firstChar === " " || firstChar === "+") newTextFragments.push(line.substr(1), hunk.linedelimiters?.[i] ?? "\n")
        })
        const newText = newTextFragments.join("")

        return vscode.TextEdit.replace(editRange, newText)
    })
}


/**
 * Activate the extension. Run automatically by VSCode based on
 * the `activationEvents` property in package.json.
 */
export function activate(): void {
    // Register formatter
    const selector: vscode.DocumentSelector = {
        scheme: "file",
        language: "stan"
    };

    const provider: vscode.DocumentFormattingEditProvider = {
        provideDocumentFormattingEdits: (
            document: vscode.TextDocument
        ): Promise<vscode.TextEdit[]> => {
            if (!vscode.workspace.getConfiguration("stan-vscode.format").get<boolean>("enable")) {
                return Promise.resolve([]);
            }
            return formatFile(document).then(hunksToEdits);
        }
    };

    registration = vscode.languages.registerDocumentFormattingEditProvider(
        selector,
        provider
    );

    logger.appendLine("Initialized Stan formatting")
}

/**
 * Deactivate the extension. Runs automatically upon deactivation or uninstall.
 */
export function deactivate(): void {
    if (registration) {
        registration.dispose();
    }
}

/**
 * Exception thrown when formatting fails.
 */
export interface FormatException {
    message: string;
}
