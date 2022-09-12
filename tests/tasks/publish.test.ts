import { childProcess, ChildProcessError, logInfo } from "nodejs-cli-runner";
import { createTempDir, deleteDir, readJsonFileStore } from "nodejs-file-utils";
import chalk from "chalk";
import { join, sep } from "path";
import { publish } from "../../src/tasks/publish";
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
    readJsonFileStore: jest.fn()
  };
});

const npmCommand = `npm${process.platform == "win32" ? ".cmd" : ""}`;

describe("Test task publish", () => {
  const packages: Package[] = [
    {
      name: "@s/pkg1",
      dirName: "p1",
      dependencies: { local: {}, external: {} }
    },
    {
      name: "@s/pkg2",
      dirName: "p2",
      dependencies: { local: {}, external: { dev: { tslib: "^2.3.1" } } }
    },
    {
      name: "@s/pkg3",
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
    mockedFunction(readJsonFileStore).mockResolvedValue({});
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(logInfo).mockReset();
    mockedFunction(childProcess).mockReset();
    mockedFunction(readJsonFileStore).mockReset();
  });

  test("without packages", async () => {
    await expect(publish(dir, [], false)).resolves.toBeUndefined();
    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(childProcess).toHaveBeenCalledTimes(0);
  });

  test("with packages", async () => {
    await expect(publish(dir, packages, false)).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Publishing: npm publish`
      );
    }
    expect(childProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(childProcess).toHaveBeenNthCalledWith(
        i,
        join(dir, `p${i}`),
        npmCommand,
        ["publish", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        chalk.magenta.bold(`[@s/pkg${i}] `)
      );
    }
  });

  test("with verbose", async () => {
    await expect(publish(dir, packages, true)).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Publishing: npm publish`
      );
    }
    expect(childProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(childProcess).toHaveBeenNthCalledWith(
        i,
        join(dir, `p${i}`),
        npmCommand,
        ["publish", "--foreground-scripts"],
        { show: "on", return: "off" },
        { show: "on", return: "off" },
        chalk.magenta.bold(`[@s/pkg${i}] `)
      );
    }
  });

  test("skip private package", async () => {
    mockedFunction(readJsonFileStore).mockImplementation(async path => {
      const packageJson = {};
      if (path.endsWith(`p2${sep}package.json`)) {
        packageJson["private"] = true;
      }
      if (path.endsWith(`p3${sep}package.json`)) {
        packageJson["private"] = false;
      }
      return packageJson;
    });
    await expect(publish(dir, packages, false)).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenCalledTimes(2);
    expect(logInfo).toHaveBeenNthCalledWith(
      1,
      `[@s/pkg1] Publishing: npm publish`
    );
    expect(logInfo).toHaveBeenNthCalledWith(
      2,
      `[@s/pkg3] Publishing: npm publish`
    );

    expect(childProcess).toHaveBeenCalledTimes(2);
    expect(childProcess).toHaveBeenNthCalledWith(
      1,
      join(dir, `p1`),
      npmCommand,
      ["publish", "--foreground-scripts"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.magenta.bold(`[@s/pkg1] `)
    );
    expect(childProcess).toHaveBeenNthCalledWith(
      2,
      join(dir, `p3`),
      npmCommand,
      ["publish", "--foreground-scripts"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.magenta.bold(`[@s/pkg3] `)
    );
  });

  test("with run failure", async () => {
    mockedFunction(childProcess).mockImplementation(async dir => {
      if (dir.endsWith("p2")) {
        throw new ChildProcessError("npm publish", {});
      }
      return {};
    });
    await expect(publish(dir, packages, false)).rejects.toEqual(
      new ChildProcessError("npm publish", {})
    );

    expect(logInfo).toHaveBeenCalledTimes(2);
    for (const i of [1, 2]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Publishing: npm publish`
      );
    }
    expect(childProcess).toHaveBeenCalledTimes(2);
    for (const i of [1, 2]) {
      expect(childProcess).toHaveBeenNthCalledWith(
        i,
        join(dir, `p${i}`),
        npmCommand,
        ["publish", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        chalk.magenta.bold(`[@s/pkg${i}] `)
      );
    }
  });
});
