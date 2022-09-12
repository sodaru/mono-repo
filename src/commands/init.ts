import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import { init } from "../tasks/init";

const initAction = async (options: CommonOptions) => {
  const dir = process.cwd();

  await taskRunner(`initialise mono-repo`, init, options.verbose, dir);
};

const initCommand = new Command("init");
initCommand.action(initAction);

export default initCommand;
