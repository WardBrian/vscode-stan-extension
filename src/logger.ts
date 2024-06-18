import { window } from "vscode"

const logger = window.createOutputChannel("Compiler Messages", "stan");

export default logger;
