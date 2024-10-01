import * as vscode from "vscode";
import TrieSearch from "trie-search";

import { logger, STAN_SELECTOR } from "./constants";
import { getMathSignatures, getMathDistributions } from "./callStanc";
import { getDocumentationForFunction } from "./documentation";
import { getDistributionName } from "./hover";

const builtInFunctions: TrieSearch<string> = new TrieSearch(undefined, {
  splitOnRegEx: /[\s_]/g,
});
const builtInDistributions: TrieSearch<string> = new TrieSearch(undefined, {
  splitOnRegEx: /[\s_]/g,
});

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

  // not technically 'functions', but still useful to autocomplete
  builtInFunctions.map("print", "print");
  builtInFunctions.map("reject", "reject");
  builtInFunctions.map("fatal_error", "fatal_error");
  builtInFunctions.map("target", "target");

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
  const function_name = getDistributionName(name);
  if (function_name) {
    completion.documentation = getDocumentationForFunction(function_name);
  }

  completion.insertText = new vscode.SnippetString(`${name}($0);`);

  return completion;
}

function makeCompletionFunction(name: string): vscode.CompletionItem {
  const completion = new vscode.CompletionItem(
    name,
    vscode.CompletionItemKind.Function,
  );
  completion.detail = "Stan built-in function";
  completion.documentation = getDocumentationForFunction(name);
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
    vscode.languages.registerCompletionItemProvider(STAN_SELECTOR, {
      provideCompletionItems,
    }),
  );
  logger.appendLine(
    `Initialized Stan completion engine with ${numFns} functions and ${numDist} distributions`,
  );
}

export default registerCompletions;
