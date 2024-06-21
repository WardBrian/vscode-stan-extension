import * as vscode from "vscode";

import { logger, STAN_SELECTOR } from "./constants";
import { getMathSignatures, getMathDistributions } from "./callStanc";
import { getDocumentationForFunction } from "./documentation";

const functionSignatureMap: Map<string, vscode.MarkdownString> = new Map();
const distributionToFunctionMap: Map<string, string> = new Map();

function setupSignatureMap() {
  const mathSignatures = getMathSignatures();
  const lines = mathSignatures.split("\n");
  for (const line of lines) {
    const [name] = line.split("(", 1);
    if (functionSignatureMap.has(name)) {
      functionSignatureMap.get(name)?.appendCodeblock(line, "stan");
    } else {
      functionSignatureMap.set(
        name,
        getDocumentationForFunction(name)
          .appendMarkdown("\n\n**Available signatures**:")
          .appendCodeblock(line, "stan"),
      );
    }
  }
  // not technically 'functions', but still useful
  functionSignatureMap.set("print", getDocumentationForFunction("print"));
  functionSignatureMap.set("reject", getDocumentationForFunction("reject"));
  functionSignatureMap.set(
    "fatal_error",
    getDocumentationForFunction("fatal_error"),
  );
  functionSignatureMap.set("target", getDocumentationForFunction("target"));

  const mathDistributions = getMathDistributions();
  const distLines = mathDistributions.split("\n");
  for (const line of distLines) {
    const [name, extensions] = line.split(":");
    const extension = extensions.split(",")[0].trim();
    distributionToFunctionMap.set(name, `${name}_${extension}`);
  }
}

function getDistributionName(fnName: string) {
  return distributionToFunctionMap.get(fnName);
}

function provideHover(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.Hover | undefined {
  let fnName: string | undefined = undefined;
  const distRange = document.getWordRangeAtPosition(position, /~\s*[\w_]+/);
  if (distRange) {
    const distName = document.getText(distRange).slice(1).trim();
    fnName = getDistributionName(distName);
  }
  if (!fnName) {
    const fnRange = document.getWordRangeAtPosition(position, /[\w_]+\s*\(/);
    if (!fnRange) return undefined;
    fnName = document.getText(fnRange).slice(0, -1).trim();
  }
  let signatures = functionSignatureMap.get(fnName);
  if (!signatures) return undefined;
  return new vscode.Hover(signatures);
}

function registerHover(context: vscode.ExtensionContext) {
  setupSignatureMap();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(STAN_SELECTOR, { provideHover }),
  );
  logger.appendLine("Initialized Stan hover text");
}

export default registerHover;
