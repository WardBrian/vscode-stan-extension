import * as vscode from "vscode";

import { logger } from "./constants";

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

function callStan(
  filename: string,
  code: string,
  args: string[] = [],
): StancReturn {
  const lineLength =
    vscode.workspace
      .getConfiguration("vscode-stan-extension.format")
      .get<number>("lineLength") ?? 78;
  const stanc_args = [
    "auto-format",
    `filename-in-msg=${filename}`,
    `max-line-length=${lineLength}`,
    "canonicalze=deprecations",
    "allow-undefined",
    ...args,
  ];
  logger.appendLine(
    `Running stanc on ${filename} with args: ${stanc_args.join(", ")}`,
  );
  return stanc(filename, code, stanc_args);
}

export function getMathSignatures(): string {
  return stancjs.dump_stan_math_signatures();
}

export function getMathDistributions(): string {
  return stancjs.dump_stan_math_distributions();
}

export default callStan;
