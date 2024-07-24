import * as vscode from "vscode";
import callStan from "./callStanc";
import { logger } from "./constants";

function rangeFromMessage(message: string): vscode.Range | undefined {
  if (!message) return undefined;
  // format is "in 'filename', line (#), column (#) to (line #,)? column (#)"
  const start = message.matchAll(/'.*', line (\d+), column (\d+)( to)?/g);
  // there will be multiple in the case of #included files
  const lastMatch = Array.from(start).pop();
  if (!lastMatch) {
    return undefined;
  }

  const startLine = parseInt(lastMatch[1]) - 1;
  const startColumn = parseInt(lastMatch[2]);

  let endLine = startLine;
  let endColumn = startColumn;

  if (lastMatch[3]) {
    // " to" was matched
    const end = message.match(/to (line (\d+), )?column (\d+)/);
    if (end) {
      if (end[1]) {
        endLine = parseInt(end[2]) - 1;
      }
      endColumn = parseInt(end[3]);
    }
  }

  return new vscode.Range(startLine, startColumn, endLine, endColumn);
}

function getWarningMessage(message: string) {
  let warning = message.replace(/Warning.*column \d+: /s, "");
  warning = warning.replace(/\s+/gs, " ");
  warning = warning.trim();
  warning = message.includes("included from")
    ? "Warning in included file:\n" + warning
    : warning;
  return warning;
}

function getErrorMessage(message: string) {
  let error = message;
  // cut off code snippet for display
  if (message.includes("------\n")) {
    error = error.split("------\n")[2];
  }
  error = error.trim();
  error = message.includes("included from")
    ? "Error in included file:\n" + error
    : error;
  error = error.includes("given information about")
    ? error +
      "\nConsider updating the includePaths setting of vscode-stan-extension"
    : error;
  return error;
}

const stanDiagnostics = vscode.languages.createDiagnosticCollection("stan");

export async function doLint(document: vscode.TextDocument) {
  let standaloneArg: string[];
  if (document.languageId === "stan") {
    standaloneArg = [];
  } else if (document.languageId === "stanfunctions") {
    standaloneArg = ["functions-only"];
  } else {
    return;
  }

  const { errors, warnings } = await callStan(document, standaloneArg);

  let diagnostics: vscode.Diagnostic[] = [];

  if (errors) {
    for (const error of errors) {
      const range = rangeFromMessage(error.toString());
      if (range === undefined) continue;
      const message = getErrorMessage(error);
      const diagnostic = new vscode.Diagnostic(
        range,
        message,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "vscode-stan-extension";
      diagnostics.push(diagnostic);
    }
  }

  if (warnings) {
    for (const warning of warnings) {
      const range = rangeFromMessage(warning);
      if (range === undefined) {
        logger.appendLine(`Warning message not parsed: ${warning}`);
        continue;
      }
      const message = getWarningMessage(warning);
      const diagnostic = new vscode.Diagnostic(
        range,
        message,
        vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.source = "vscode-stan-extension";
      diagnostics.push(diagnostic);
    }
  }
  stanDiagnostics.set(document.uri, diagnostics);
}

function registerLinter(context: vscode.ExtensionContext) {
  context.subscriptions.push(stanDiagnostics);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doLint, null, context.subscriptions),
  );
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(
      textDocument => {
        stanDiagnostics.delete(textDocument.uri);
      },
      null,
      context.subscriptions,
    ),
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doLint, null, context.subscriptions),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      event => doLint(event.document),
      null,
      context.subscriptions,
    ),
  );
  vscode.workspace.textDocuments.forEach(doLint, null);
  logger.appendLine("Initialized Stan linter");
}

export default registerLinter;
