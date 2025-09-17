import * as vscode from "vscode";
import * as path from "path";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

const logger = vscode.window.createOutputChannel("Stan Extension");

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext): void {
  logger.appendLine("Activating Stan extension");
  let serverModule = context.asAbsolutePath(path.join("node_modules", "stan-language-server", "dist", "server", "cli.js"));

  let serverOptions: ServerOptions = {
    module: serverModule,
    transport: TransportKind.stdio,
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: ["stan", "stanfunctions"],
    outputChannel: logger,
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
