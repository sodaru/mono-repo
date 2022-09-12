import { logInfo } from "nodejs-cli-runner";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles
} from "nodejs-file-utils";
import { existsSync } from "fs";
import { symlink } from "fs/promises";
import { join } from "path";
import { clean } from "../../src/tasks/clean";
import { mockedFunction } from "../testutils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    logInfo: jest.fn()
  };
});

describe("Test task clean", () => {
  const files = {
    "p1/package.json": "p1",
    "p2/package.json": "p2",
    "p2/node_modules/": "",
    "p3/package.json": "p3",
    "p3/node_modules/m1/index.js": "p3-m1",
    "p4/package.json": "p4",
    "p4/node_modules/m1/index.js": "p4-m1",
    "p4/node_modules/m2/index.js": "p4-m2"
  };

  const packages = [
    {
      name: "pkg1",
      dirName: "p1",
      dependencies: { local: {}, external: {} }
    },
    {
      name: "pkg2",
      dirName: "p2",
      dependencies: { local: {}, external: {} }
    },
    {
      name: "pkg3",
      dirName: "p3",
      dependencies: { local: {}, external: {} }
    },
    {
      name: "pkg4",
      dirName: "p4",
      dependencies: { local: { dep: { pkg2: "^1.0.1" } }, external: {} }
    }
  ];

  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
    createFiles(dir, files);
    symlink(join(dir, "p2"), join(dir, "p4/node_modules/pkg2"), "junction");
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(logInfo).mockReset();
  });

  test("clean without filterPackages", async () => {
    await expect(clean(dir, packages, [])).resolves.toBeUndefined();

    expect(readFiles(dir)).toEqual({
      "p1/package.json": "p1",
      "p2/package.json": "p2",
      "p3/package.json": "p3",
      "p4/package.json": "p4"
    });

    expect(mockedFunction(logInfo)).toHaveBeenCalledTimes(4);
    for (const i of [1, 2, 3, 4]) {
      expect(mockedFunction(logInfo)).toHaveBeenNthCalledWith(
        i,
        `[pkg${i}] Cleaning: node_modules`
      );
    }
  });

  test("clean with filterPackages", async () => {
    await expect(
      clean(dir, packages, ["pkg1", "pkg4"])
    ).resolves.toBeUndefined();

    expect(readFiles(dir)).toEqual({
      "p1/package.json": "p1",
      "p2/package.json": "p2",
      "p3/package.json": "p3",
      "p3/node_modules/m1/index.js": "p3-m1",
      "p4/package.json": "p4"
    });

    expect(existsSync(join(dir, "p2/node_modules"))).toBeTruthy();

    expect(mockedFunction(logInfo)).toHaveBeenCalledTimes(2);
    expect(mockedFunction(logInfo)).toHaveBeenNthCalledWith(
      1,
      `[pkg1] Cleaning: node_modules`
    );
    expect(mockedFunction(logInfo)).toHaveBeenNthCalledWith(
      2,
      `[pkg4] Cleaning: node_modules`
    );
  });
});
