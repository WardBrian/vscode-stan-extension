import * as vscode from "vscode";

import logger from "./logger";
import { getMathSignatures, getMathDistributions } from "./callStanc";
import { getDocumentationForFunction } from "./documentation";

const functionSignatureMap: Map<
  string,
  Array<string | vscode.MarkdownString>
> = new Map();
const distributionToFunctionMap: Map<string, string> = new Map();

function setupSignatureMap() {
  const mathSignatures = getMathSignatures();
  const lines = mathSignatures.split("\n");
  for (const line of lines) {
    const [name] = line.split("(", 1);
    if (functionSignatureMap.has(name)) {
      functionSignatureMap.get(name)?.push(`\`${line}\``);
    } else {
      functionSignatureMap.set(name, [
        getDocumentationForFunction(name),
        "Available signatures",
        `\`${line}\``,
      ]);
    }
  }

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
  const fnRange = document.getWordRangeAtPosition(position, /[\w_]+\s*\(/);
  if (!fnRange) {
    return undefined;
  }
  let fnName = document.getText(fnRange).slice(0, -1).trim();
  const distName = getDistributionName(fnName);
  if (distName) {
    fnName = distName;
  }

  const signatures = functionSignatureMap.get(fnName);
  if (!signatures) {
    return undefined;
  }
  return new vscode.Hover(signatures);
}

function registerHover(context: vscode.ExtensionContext) {
  setupSignatureMap();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("stan", { provideHover }),
  );
  logger.appendLine("Initialized Stan hover text");
}

export default registerHover;
