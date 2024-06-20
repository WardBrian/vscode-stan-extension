import * as vscode from "vscode";
import TrieSearch from "trie-search";

import logger from "./logger";
import { getMathSignatures, getMathDistributions } from "./callStanc";
import { getDocumentationForFunction } from "./documentation";

const builtInFunctions: TrieSearch<string> = new TrieSearch();
const builtInDistributions: TrieSearch<string> = new TrieSearch();

function setUpTries() {
  const mathSignatures = getMathSignatures();
  const lines = mathSignatures.split("\n");

  const completions = new Set<string>();
  for (const line of lines) {
    const [name] = line.split("(", 1);
    completions.add(name);
  }
  for (const name of completions) {
    builtInFunctions.map(name, name);
  }

  const mathDistributions = getMathDistributions();
  const distLines = mathDistributions.split("\n");
  for (const line of distLines) {
    const [name] = line.split(":");
    builtInDistributions.map(name, name);
  }

  return { numFns: completions.size, numDist: distLines.length };
}

function makeDistributionCompletion(name: string): vscode.CompletionItem {
  const completion = new vscode.CompletionItem(
    name,
    vscode.CompletionItemKind.Function,
  );
  completion.detail = "Stan built-in distribution";
  completion.insertText = new vscode.SnippetString(`${name}($0);`);

  return completion;
}

function makeCompletionFunction(name: string): vscode.CompletionItem {
  const completion = new vscode.CompletionItem(
    name,
    vscode.CompletionItemKind.Function,
  );
  completion.detail = "Stan built-in function";
  completion.insertText = new vscode.SnippetString(`${name}($0)`);

  return completion;
}

function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  context: vscode.CompletionContext,
) {
  const completions: vscode.CompletionItem[] = [];

  const distRange = document.getWordRangeAtPosition(position, /~\s*[\w_]+/);
  if (distRange) {
    const distName = document.getText(distRange).slice(1).trim();
    const fnNames = builtInDistributions.search(distName);
    for (const name of fnNames) {
      completions.push(makeDistributionCompletion(name));
    }
    return completions;
  }

  const fnRange = document.getWordRangeAtPosition(position);
  if (!fnRange) {
    return undefined;
  }
  let fnName = document.getText(fnRange).trim();

  const fnNames = builtInFunctions.search(fnName);
  for (const name of fnNames) {
    completions.push(makeCompletionFunction(name));
  }
  return completions;
}

function registerCompletions(context: vscode.ExtensionContext) {
  const { numFns, numDist } = setUpTries();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(["stan", "stanfunctions"], {
      provideCompletionItems,
    }),
  );
  logger.appendLine(
    `Initialized Stan completion engine with ${numFns} functions and ${numDist} distributions`,
  );
}

export default registerCompletions;