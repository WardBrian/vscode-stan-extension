import { ExtensionContext, Uri } from "vscode";
import { LanguageClientOptions } from "vscode-languageclient";

import { LanguageClient } from "vscode-languageclient/browser";
import { logger, STAN_SELECTOR } from "../constants";

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext) {
  logger.appendLine("Activating Stan extension");

  const clientOptions: LanguageClientOptions = {
    documentSelector: STAN_SELECTOR,
    outputChannel: logger,
  };

  const serverMain = Uri.joinPath(context.extensionUri, "dist/web/server.js");
  const worker = new Worker(serverMain.toString(true));

  client = new LanguageClient(
    "StanLSP",
    "Stan Language Server",
    clientOptions,
    worker,
  );

  await client.start();
}

export async function deactivate(): Promise<void> {
  if (client !== undefined) {
    await client.stop();
  }
}
