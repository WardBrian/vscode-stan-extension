import startLanguageServer from "stan-language-server";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { promises } from "fs";

const connection = createConnection(ProposedFeatures.all);

startLanguageServer(connection, f => promises.readFile(f, "utf8"));
