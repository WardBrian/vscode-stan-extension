import * as vscode from "vscode";

import { logger } from "./constants";
import getIncludedFiles from "./includes";

type StancReturn =
  | { errors: undefined; result: string; warnings?: string[] }
  | { errors: string[]; result: undefined; warnings?: string[] };

type StancFunction = (
  filename: string,
  code: string,
  options: string[],
  includes?: Record<string, string>,
) => StancReturn;

const stancjs = require("./stanc.js");
const stanc: StancFunction = stancjs.stanc;

const stanc_version = stanc("", "", ["version"]).result;
logger.appendLine(`Loaded stanc.js, version '${stanc_version}'`);

async function callStan(
  document: vscode.TextDocument,
  args: string[] = [],
): Promise<StancReturn> {
  const lineLength =
    vscode.workspace
      .getConfiguration("vscode-stan-extension.format")
      .get<number>("lineLength") ?? 78;

  const filename = document.fileName;
  const code = document.getText();
  const includes = await getIncludedFiles(document);

  const stanc_args = [
    "auto-format",
    `filename-in-msg=${filename}`,
    `max-line-length=${lineLength}`,
    "canonicalze=deprecations",
    "allow-undefined",
    ...args,
  ];
  logger.appendLine(
    `Running stanc on ${filename} with args: ${stanc_args.join(", ")}, and includes: ${Object.keys(includes).join(", ")}`,
  );
  return stanc(filename, code, stanc_args, includes);
}

export function getMathSignatures(): string {
  return stancjs.dump_stan_math_signatures();
}

export function getMathDistributions(): string {
  return stancjs.dump_stan_math_distributions();
}

export default callStan;
