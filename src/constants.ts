import { DocumentSelector, window } from "vscode";

export const STAN_SELECTOR = [
  { language: "stan" },
  { language: "stanfunctions" },
] satisfies DocumentSelector;
export const logger = window.createOutputChannel("Stan Extension");
