import {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles
} from "nodejs-file-utils";
import { join } from "path";
import { install } from "../../src/tasks/install";
import { Package } from "../../src/types";
import cloneDeep from "lodash/cloneDeep";
import { ChildProcessError, logInfo, childProcess } from "nodejs-cli-runner";
import { CyclicError } from "graph-dsa";
import chalk from "chalk";
import { mockedFunction } from "../testutils";
import ErrorSet from "../../src/utils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    logInfo: jest.fn(),
    childProcess: jest.fn()
  };
});

const npmCommand = `npm${process.platform == "win32" ? ".cmd" : ""}`;

describe("Test task install", () => {
  const files: Record<string, string> = {
    "p1/package.json":
      JSON.stringify({ name: "@s/pkg1", version: "1.0.1" }, null, 2) + "\n",
    "p2/package.json":
      JSON.stringify(
        {
          name: "@s/pkg2",
          version: "1.0.1",
          devDependencies: { tslib: "^2.3.1" }
        },
        null,
        2
      ) + "\n",
    "p3/package.json":
      JSON.stringify(
        {
          name: "@s/pkg3",
          version: "1.0.1",
          dependencies: { "@s/pkg1": "^1.0.1" }
        },
        null,
        2
      ) + "\n"
  };
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
  const mockedChildProcess = mockedFunction(childProcess);
  const mockedLogInfo = mockedFunction(logInfo);

  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
    createFiles(dir, files);
  });

  afterEach(() => {
    mockedLogInfo.mockReset();
    mockedChildProcess.mockReset();
    deleteDir(dir);
  });

  const getPackages = () => {
    const originalPackages = cloneDeep(packages);
    const packagesToUse = cloneDeep(originalPackages);
    return [originalPackages, packagesToUse];
  };

  test("with empty packages", async () => {
    await expect(
      install(dir, "1.0.1", [], [], "save", [], false)
    ).resolves.toBeUndefined();
    expect(readFiles(dir)).toEqual(files);
    expect(mockedLogInfo).toHaveBeenCalledTimes(0);
    expect(mockedChildProcess).toHaveBeenCalledTimes(0);
  });

  test("with no packages to install", async () => {
    const [originalPackages, packagesToUse] = getPackages();
    await expect(
      install(dir, "1.0.1", packagesToUse, [], "save", [], false)
    ).resolves.toBeUndefined();
    expect(readFiles(dir)).toEqual(files);
    expect(packagesToUse).toEqual(originalPackages);
    expect(mockedLogInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedLogInfo).toHaveBeenNthCalledWith(
        i,
        expect.stringMatching("\\[\\@s\\/pkg[1-3]\\] Installing: npm install")
      );
    }
    expect(mockedChildProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedChildProcess).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(join(dir, "p")),
        npmCommand,
        ["install", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        expect.stringContaining("@s/pkg")
      );
    }
  });

  test("with invalid package to install", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [originalPackages, packagesToUse] = getPackages();
    mockedChildProcess.mockRejectedValue(
      new ChildProcessError(`${npmCommand} install @sdrtyyuiie/a --save`, {})
    );
    await expect(
      install(dir, "1.0.1", packagesToUse, ["@sdrtyyuiie/a"], "save", [], false)
    ).rejects.toEqual(
      new ErrorSet(
        Array(3).fill(
          new ChildProcessError(
            `${npmCommand} install @sdrtyyuiie/a --save`,
            {}
          )
        )
      )
    );

    expect(readFiles(dir)).toEqual(files);
    expect(mockedLogInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedLogInfo).toHaveBeenNthCalledWith(
        i,
        expect.stringMatching("\\[\\@s\\/pkg[1-3]\\] Installing: npm install")
      );
    }
    expect(mockedChildProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedChildProcess).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(join(dir, "p")),
        npmCommand,
        ["install", "@sdrtyyuiie/a", "--save", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        expect.stringContaining("@s/pkg")
      );
    }
  });

  test("with valid external package to install", async () => {
    const [originalPackages, packagesToUse] = getPackages();
    await expect(
      install(dir, "1.0.1", packagesToUse, ["smallest"], "save", [], false)
    ).resolves.toBeUndefined();

    expect(readFiles(dir)).toEqual(files);
    expect(packagesToUse).toEqual(originalPackages);
    expect(mockedLogInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedLogInfo).toHaveBeenNthCalledWith(
        i,
        expect.stringMatching(
          "\\[\\@s\\/pkg[1-3]\\] Installing: npm install smallest --save"
        )
      );
    }
    expect(mockedChildProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedChildProcess).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(join(dir, "p")),
        npmCommand,
        ["install", "smallest", "--save", "--foreground-scripts"],
        { show: "error", return: "off" },
        { show: "error", return: "off" },
        expect.stringContaining("@s/pkg")
      );
    }
  });

  test("with valid external package in selected package", async () => {
    const [originalPackages, packagesToUse] = getPackages();
    await expect(
      install(
        dir,
        "1.0.1",
        packagesToUse,
        ["smallest"],
        "save-peer",
        ["@s/pkg2"],
        false
      )
    ).resolves.toBeUndefined();

    expect(readFiles(dir)).toEqual(files);
    expect(packagesToUse).toEqual(originalPackages);
    expect(mockedLogInfo).toHaveBeenCalledTimes(1);
    expect(mockedLogInfo).toHaveBeenNthCalledWith(
      1,
      `[@s/pkg2] Installing: npm install smallest --save-peer`
    );
    expect(mockedChildProcess).toHaveBeenCalledTimes(1);
    expect(mockedChildProcess).toHaveBeenNthCalledWith(
      1,
      join(dir, "p2"),
      npmCommand,
      ["install", "smallest", "--save-peer", "--foreground-scripts"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.cyan.bold(`[@s/pkg2] `)
    );
  });

  test("with valid local package to install", async () => {
    const [originalPackages, packagesToUse] = getPackages();
    await expect(
      install(
        dir,
        "1.0.1",
        packagesToUse,
        ["@s/pkg2"],
        "save-dev",
        ["@s/pkg3"],
        false
      )
    ).resolves.toBeUndefined();
    originalPackages[2].dependencies.local.dev = { "@s/pkg2": "^1.0.1" };

    const _files = cloneDeep(files);
    _files["p3/package.json"] =
      JSON.stringify(
        {
          name: "@s/pkg3",
          version: "1.0.1",
          dependencies: { "@s/pkg1": "^1.0.1" },
          devDependencies: { "@s/pkg2": "^1.0.1" }
        },
        null,
        2
      ) + "\n";

    expect(readFiles(dir)).toEqual(_files);
    expect(packagesToUse).toEqual(originalPackages);
    expect(mockedLogInfo).toHaveBeenCalledTimes(1);
    expect(mockedLogInfo).toHaveBeenNthCalledWith(
      1,
      `[@s/pkg3] Installing: npm install`
    );
    expect(mockedChildProcess).toHaveBeenCalledTimes(1);
    expect(mockedChildProcess).toHaveBeenNthCalledWith(
      1,
      join(dir, "p3"),
      npmCommand,
      ["install", "--foreground-scripts"],
      { show: "error", return: "off" },
      { show: "error", return: "off" },
      chalk.cyan.bold(`[@s/pkg3] `)
    );
  });

  test("with cyclic local package to install", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [originalPackages, packagesToUse] = getPackages();
    await expect(
      install(
        dir,
        "1.0.1",
        packagesToUse,
        ["@s/pkg3"],
        "save-dev",
        ["@s/pkg1"],
        false
      )
    ).rejects.toEqual(new CyclicError("@s/pkg1", ["@s/pkg1", "@s/pkg3"]));

    expect(readFiles(dir)).toEqual(files);
    expect(mockedLogInfo).toHaveBeenCalledTimes(0);
    expect(mockedChildProcess).toHaveBeenCalledTimes(0);
  });

  test("with valid external package with verbose to install", async () => {
    const [originalPackages, packagesToUse] = getPackages();

    await expect(
      install(dir, "1.0.1", packagesToUse, ["smallest"], "save-dev", [], true)
    ).resolves.toBeUndefined();

    expect(readFiles(dir)).toEqual(files);
    expect(packagesToUse).toEqual(originalPackages);
    expect(mockedLogInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedLogInfo).toHaveBeenNthCalledWith(
        i,
        expect.stringMatching(
          "\\[\\@s\\/pkg[1-3]\\] Installing: npm install smallest --save-dev"
        )
      );
    }
    expect(mockedChildProcess).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(mockedChildProcess).toHaveBeenNthCalledWith(
        i,
        expect.stringContaining(join(dir, "p")),
        npmCommand,
        ["install", "smallest", "--save-dev", "--foreground-scripts"],
        { show: "on", return: "off" },
        { show: "on", return: "off" },
        expect.stringContaining("@s/pkg")
      );
    }
  });
});
