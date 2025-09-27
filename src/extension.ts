import * as path from "path";
import { ExtensionContext, workspace } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

import { logger, STAN_SELECTOR } from "./constants";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  logger.appendLine("Activating Stan extension");
  let serverModule = context.asAbsolutePath(path.join("dist", "server.js"));

  let serverOptions: ServerOptions = {
    module: serverModule,
    transport: TransportKind.ipc,
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: STAN_SELECTOR,
    outputChannel: logger,
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.stan(functions)?"),
    },
  };

  client = new LanguageClient(
    "StanLSP",
    "Stan Language Server",
    serverOptions,
    clientOptions,
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
