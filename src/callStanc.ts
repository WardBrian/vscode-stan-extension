import * as vscode from "vscode";
import logger from "./logger";

type StancReturn =
  | { errors: undefined; result: string; warnings?: string[] }
  | { errors: string[]; result: undefined; warnings?: string[] };

type StancFunction = (
  filename: string,
  code: string,
  options: string[],
) => StancReturn;

const stancjs = require("./stanc.js");
const stanc: StancFunction = stancjs.stanc;

logger.appendLine("Loaded stanc.js");

function callStan(filename: string, code: string): StancReturn {
  const lineLength =
    vscode.workspace
      .getConfiguration("vscode-stan-extension.format")
      .get<number>("lineLength") ?? 78;
  const args = [
    "auto-format",
    `filename-in-msg=${filename}`,
    `max-line-length=${lineLength}`,
    "canonicalze=deprecations",
    "allow-undefined",
  ];
  logger.appendLine(
    `Running stanc on ${filename} with args: ${args.join(", ")}`,
  );
  return stanc(filename, code, args);
}

export default callStan;
