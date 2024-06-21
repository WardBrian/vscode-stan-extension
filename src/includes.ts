import * as vscode from "vscode";

import { logger } from "./constants";

const findIncludes = /#include\s*[<"]?([^>"\s]*)[>"]?/g;

function replaceWorkspaceFolderPattern(path: string): vscode.Uri[] {
  if (!path.includes("${workspaceFolder}")) {
    return [vscode.Uri.file(path)];
  }
  return (
    vscode.workspace.workspaceFolders?.map(folder =>
      vscode.Uri.joinPath(folder.uri, path.replace("${workspaceFolder}", "")),
    ) ?? []
  );
}

async function searchIncludePaths(
  documentUri: vscode.Uri,
  filename: string,
): Promise<vscode.Uri | undefined> {
  const cwd = vscode.Uri.joinPath(documentUri, "..");
  const includePaths =
    vscode.workspace
      .getConfiguration("vscode-stan-extension")
      .get<string[]>("includePaths") ?? [];

  const toSearch = [
    ...includePaths.flatMap(replaceWorkspaceFolderPattern),
    cwd,
  ];

  for (const path of toSearch) {
    logger.appendLine(`Searching for ${filename} in ${path}`);
    const possiblePath = vscode.Uri.joinPath(path, filename);
    try {
      const file = await vscode.workspace.fs.stat(possiblePath);
      if (file.type === vscode.FileType.File) return possiblePath;
    } catch (_error: any) {}
  }
}

async function getIncludedFiles(
  document: vscode.TextDocument,
): Promise<Record<string, string>> {
  const code = document.getText();
  if (!code.includes("#include")) {
    return {};
  }
  const includes: Record<string, string> = {};
  for (const match of code.matchAll(findIncludes)) {
    const filename = match[1];
    if (!filename) {
      continue;
    }

    const location = await searchIncludePaths(document.uri, filename);
    if (!location) {
      logger.appendLine(`Could not find included file ${filename}`);
      continue;
    }
    try {
      const bytes = await vscode.workspace.fs.readFile(location);

      includes[filename] = new TextDecoder().decode(bytes);
    } catch (e) {
      logger.appendLine(`Error reading included file ${location}: ${e}`);
    }
  }

  return includes;
}

export default getIncludedFiles;
