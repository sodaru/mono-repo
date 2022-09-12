import { rootCommand } from "nodejs-cli-runner";
import cleanCommand from "./commands/clean";
import createCommand from "./commands/create";
import initCommand from "./commands/init";
import installCommand from "./commands/install";
import publishCommand from "./commands/publish";
import runCommand from "./commands/run";
import validateCommand from "./commands/validate";
import versionCommand from "./commands/version";

const cmd = rootCommand(
  "mono-repo",
  [
    installCommand,
    cleanCommand,
    createCommand,
    runCommand,
    versionCommand,
    publishCommand,
    initCommand,
    validateCommand
  ],
  {
    skipSuccessLog: true
  }
);

export default cmd;
