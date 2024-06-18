
import * as vscode from "vscode";
import logger from "./logger";
import provideDocumentFormattingEdits from "./formatter";

let formatterRegistration: vscode.Disposable | undefined;

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
    formatterRegistration = vscode.languages.registerDocumentFormattingEditProvider(
        selector,
        { provideDocumentFormattingEdits }
    );

    logger.appendLine("Initialized Stan formatting")
}

/**
 * Deactivate the extension. Runs automatically upon deactivation or uninstall.
 */
export function deactivate(): void {
    if (formatterRegistration) {
        formatterRegistration.dispose();
    }
}
