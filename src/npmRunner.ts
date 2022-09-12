import { childProcess, ChildProcessStreamConfig } from "nodejs-cli-runner";

export const npmRunner = async (
  dir: string,
  cmd: string,
  args: string[],
  verbose = false,
  prefix?: string
) => {
  const streamConfig: ChildProcessStreamConfig = {
    show: verbose ? "on" : "error",
    return: "off"
  };

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const commandArguments = [cmd, ...args];

  await childProcess(
    dir,
    command,
    commandArguments,
    streamConfig,
    streamConfig,
    prefix
  );
};
