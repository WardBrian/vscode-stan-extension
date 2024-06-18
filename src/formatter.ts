import * as vscode from "vscode";
import { Hunk, ParsedDiff, createPatch, parsePatch } from "diff";

import logger from "./logger";
import callStan from "./callStanc";


async function alertFormattingError(
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
 * Convert any number of hunks to a matching array of native VSCode edits.
 * @param hunks Array of hunks to convert to edits.
 * @returns Array of VSCode text edits, which map directly to the input hunks.
 */
function hunksToEdits(hunks: Hunk[]): vscode.TextEdit[] {
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
 * Format a file using Docformatter and return the edit hunks without
 * modifying the file.
 * @returns A promise that resolves to the edit hunks, which can then be
 * converted to edits and applied to the file. If the promise rejects, will
 * automatically show an error message to the user.
 */
function provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
    const code = document.getText();
    const fileName = document.fileName;
    const { errors, result } = callStan(fileName, code);

    if (errors) {
        alertFormattingError(errors);
        throw new Error("Formatting failed: " + errors.join("\n"));
    }
    const patch = createPatch(fileName, code, result);
    const parsed: ParsedDiff[] = parsePatch(patch);
    return hunksToEdits(parsed[0].hunks);
}


export default provideDocumentFormattingEdits;
