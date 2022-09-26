import { childProcess, ChildProcessError, logInfo } from "nodejs-cli-runner";
import { createTempDir, deleteDir, readJsonFileStore } from "nodejs-file-utils";
import chalk from "chalk";
import { join, sep } from "path";
import { run } from "../../src/tasks/run";
import { Package } from "../../src/types";
import { mockedFunction } from "../testutils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    logInfo: jest.fn(),
    childProcess: jest.fn()
  };
});

jest.mock("nodejs-file-utils", () => {
  const originalModule = jest.requireActual("nodejs-file-utils");
  return {
    __esModule: true,
    ...originalModule,
    readJsonFileStore: jest
      .fn()
      .mockResolvedValue({ scripts: { test: "jest", build: "tsc" } })
  };
});

const npmCommand = `npm${process.platform == "win32" ? ".cmd" : ""}`;

describe("Test task run", () => {
  const packages: Package[] = [
    {
      name: "@s/pkg1",
      version: "1.0.0",
      dirName: "p1",
      dependencies: { local: {}, external: {} }
    },
    {
      name: "@s/pkg2",
      version: "1.0.0",
      dirName: "p2",
      dependencies: { local: {}, external: { dev: { tslib: "^2.3.1" } } }
    },
    {
      name: "@s/pkg3",
      version: "1.0.0",
      dirName: "p3",
      dependencies: {
        local: { dep: { "@s/pkg1": "^1.0.1" } },
        external: {}
      }
    }
  ];

  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
    mockedFunction(childProcess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(logInfo).mockReset();
    mockedFunction(childProcess).mockReset();
  });

  test("without packages", async () => {
    await expect(run(dir, "test", [], [], [], false)).resolves.toBeUndefined();
    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(childProcess).toHaveBeenCalledTimes(0);
  });

  test("with no filtered packages", async () => {
    await expect(
      run(dir, "test", [], packages, [], false)
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Running: npm run test`
      );
    }
    expect(childProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(childProcess).toHaveBeenNthCalledWith(
        i,
        join(dir, `p${i}`),
        npmCommand,
        ["run", "test", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        chalk.green.bold(`[@s/pkg${i}] `)
      );
    }
  });

  test("with filtered packages", async () => {
    await expect(
      run(dir, "test", [], packages, ["@s/pkg2", "@s/pkg5"], false)
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(`[@s/pkg2] Running: npm run test`);
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      join(dir, `p2`),
      npmCommand,
      ["run", "test", "--foreground-scripts"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.green.bold(`[@s/pkg2] `)
    );
  });

  test("with script args", async () => {
    await expect(
      run(
        dir,
        "build",
        ["--env", "local"],
        packages,
        ["@s/pkg2", "@s/pkg5"],
        false
      )
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(
      `[@s/pkg2] Running: npm run build -- --env local`
    );
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      join(dir, `p2`),
      npmCommand,
      ["run", "build", "--foreground-scripts", "--", "--env", "local"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.green.bold(`[@s/pkg2] `)
    );
  });

  test("with verbose", async () => {
    await expect(
      run(
        dir,
        "build",
        ["--env", "local"],
        packages,
        ["@s/pkg2", "@s/pkg5"],
        true
      )
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(
      `[@s/pkg2] Running: npm run build -- --env local`
    );
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      join(dir, `p2`),
      npmCommand,
      ["run", "build", "--foreground-scripts", "--", "--env", "local"],
      { show: "on", return: "off" },
      { show: "on", return: "off" },
      chalk.green.bold(`[@s/pkg2] `)
    );
  });

  test("with run failure", async () => {
    mockedFunction(childProcess).mockImplementation(async dir => {
      if (dir.endsWith("p2")) {
        throw new ChildProcessError("npm run build -- --env local", {});
      }
      return {};
    });
    await expect(
      run(dir, "build", ["--env", "local"], packages, [], false)
    ).rejects.toEqual(
      new ChildProcessError("npm run build -- --env local", {})
    );

    expect(logInfo).toHaveBeenCalledTimes(2);
    for (const i of [1, 2]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Running: npm run build -- --env local`
      );
    }
    expect(childProcess).toHaveBeenCalledTimes(2);
    for (const i of [1, 2]) {
      expect(childProcess).toHaveBeenNthCalledWith(
        i,
        join(dir, `p${i}`),
        npmCommand,
        ["run", "build", "--foreground-scripts", "--", "--env", "local"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        chalk.green.bold(`[@s/pkg${i}] `)
      );
    }
  });

  test("with no scripts in packageJson", async () => {
    mockedFunction(readJsonFileStore).mockImplementation(async path => {
      const packageJson = {};
      if (path.endsWith("p1" + sep + "package.json")) {
        packageJson["scripts"] = {};
      }
      if (path.endsWith("p2" + sep + "package.json")) {
        packageJson["scripts"] = { a: "abcd" };
      }
      return packageJson;
    });

    await expect(
      run(dir, "test", [], packages, [], false)
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(childProcess).toHaveBeenCalledTimes(0);
  });
});
