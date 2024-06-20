import { MarkdownString } from "vscode";

export function getDocumentationForFunction(name: string): MarkdownString {
  return new MarkdownString(
    `[$(link-external) Jump to Stan Functions Reference index entry](https://mc-stan.org/docs/functions-reference/functions_index.html#${name})`,
    true,
  );
}
