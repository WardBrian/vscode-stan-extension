import * as vscode from "vscode";
import callStan from "./callStanc";
import logger from "./logger";

function rangeFromMessage(message: string): vscode.Range | undefined {
  // format is "in 'filename', line (#)), column (#) to (line #,)? column (#)"
  const start = message.match(/in '.*', line (\d+), column (\d+)( to)?/);
  if (!start) {
    return undefined;
  }

  const startLine = parseInt(start[1]) - 1;
  const startColumn = parseInt(start[2]);

  let endLine = startLine;
  let endColumn = startColumn;

  if (start[4]) {
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
  message = message.replace(/Warning.*column \d+: /, "");
  message = message.replace(/\s+/gs, " ");
  return message.trim();
}

function getErrorMessage(message: string) {
  // cut off code snippet for display
  if (message.includes("------\n")) {
    message = message.split("------\n")[2];
  }
  return message.trim();
}

const stanDiagnostics = vscode.languages.createDiagnosticCollection("stan");

export async function doLint(document: vscode.TextDocument) {
  if (document.languageId !== "stan") return;

  const code = document.getText();
  const fileName = document.fileName;
  const { errors, warnings } = callStan(fileName, code);

  let diagnostics: vscode.Diagnostic[] = [];

  if (errors) {
    for (const error of errors) {
      const range = rangeFromMessage(error.toString());
      if (range === undefined) continue;
      const message = getErrorMessage(error);
      if (message.includes("include paths")) continue; // not currently supported by stancjs
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
      if (range === undefined) continue;
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
  vscode.workspace.onDidOpenTextDocument(doLint, null, context.subscriptions);
  vscode.workspace.onDidCloseTextDocument(
    textDocument => {
      stanDiagnostics.delete(textDocument.uri);
    },
    null,
    context.subscriptions,
  );
  vscode.workspace.onDidSaveTextDocument(doLint, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(
    event => doLint(event.document),
    null,
    context.subscriptions,
  );
  vscode.workspace.textDocuments.forEach(doLint, null);
  logger.appendLine("Initialized Stan linter");
}

export default registerLinter;
