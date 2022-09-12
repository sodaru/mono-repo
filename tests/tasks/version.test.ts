import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore,
  createTempDir,
  deleteDir
} from "nodejs-file-utils";
import { logInfo } from "nodejs-cli-runner";
import { join, sep } from "path";
import { version } from "../../src/tasks/version";
import { Package, PackageJson } from "../../src/types";
import cloneDeep from "lodash/cloneDeep";
import { mockedFunction } from "../testutils";
import ErrorSet from "../../src/utils";

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

const packageJsonList: PackageJson[] = [
  { name: "@s/pkg1", version: "1.0.1" },
  { name: "@s/pkg2", version: "1.0.1", devDependencies: { tslib: "^2.3.1" } },
  { name: "@s/pkg3", version: "1.0.1", dependencies: { "@s/pkg1": "^1.0.1" } }
];

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    logInfo: jest.fn()
  };
});

jest.mock("nodejs-file-utils", () => {
  const originalModule = jest.requireActual("nodejs-file-utils");
  return {
    __esModule: true,
    ...originalModule,
    readJsonFileStore: jest.fn(),
    updateJsonFileStore: jest.fn(),
    saveJsonFileStore: jest.fn()
  };
});

describe("Test task version", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
    mockedFunction(readJsonFileStore).mockImplementation(async path => {
      if (path.endsWith(`p1${sep}package.json`)) {
        return packageJsonList[0];
      }
      if (path.endsWith(`p2${sep}package.json`)) {
        return packageJsonList[1];
      }
      if (path.endsWith(`p3${sep}package.json`)) {
        return packageJsonList[2];
      }
      if (path.endsWith(`p2${sep}package-lock.json`)) {
        return { version: "0.0.0" };
      }
      if (path.endsWith(`p3${sep}package-lock.json`)) {
        return {
          version: "0.0.0",
          packages: { "": { version: "0.0.0" }, a: { version: "2.4.0" } }
        };
      }
    });
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(logInfo).mockReset();
    mockedFunction(readJsonFileStore).mockReset();
    mockedFunction(updateJsonFileStore).mockReset();
    mockedFunction(saveJsonFileStore).mockReset();
  });

  test("without packages", async () => {
    await expect(version(dir, "1.1.0", [])).resolves.toBeUndefined();
    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(updateJsonFileStore).toHaveBeenCalledTimes(0);
  });

  test("with packages", async () => {
    const originalPackages = cloneDeep(packages);
    const packagesToUse = cloneDeep(originalPackages);

    await expect(version(dir, "1.1.0", packagesToUse)).resolves.toBeUndefined();

    originalPackages[2].dependencies.local.dep["@s/pkg1"] = "^1.1.0";
    expect(packagesToUse).toEqual(originalPackages);

    expect(logInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Versioning: 1.1.0`
      );
    }

    expect(updateJsonFileStore).toHaveBeenCalledTimes(5);
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join(dir, "p1", "package.json"),
      {
        name: "@s/pkg1",
        version: "1.1.0"
      }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      2,
      join(dir, "p2", "package.json"),
      {
        name: "@s/pkg2",
        version: "1.1.0",
        devDependencies: { tslib: "^2.3.1" }
      }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      3,
      join(dir, "p3", "package.json"),
      {
        name: "@s/pkg3",
        version: "1.1.0",
        dependencies: { "@s/pkg1": "^1.1.0" }
      }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      4,
      join(dir, "p2", "package-lock.json"),
      { version: "1.1.0" }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      5,
      join(dir, "p3", "package-lock.json"),
      {
        version: "1.1.0",
        packages: { "": { version: "1.1.0" }, a: { version: "2.4.0" } }
      }
    );

    expect(saveJsonFileStore).toHaveBeenCalledTimes(5);
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join(dir, "p1", "package.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      2,
      join(dir, "p2", "package.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      3,
      join(dir, "p3", "package.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      4,
      join(dir, "p2", "package-lock.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      5,
      join(dir, "p3", "package-lock.json")
    );
  });

  test("with error in second package", async () => {
    mockedFunction(readJsonFileStore).mockImplementation(async path => {
      if (path.endsWith(`p1${sep}package.json`)) {
        return packageJsonList[0];
      }
      if (path.endsWith(`p2${sep}package.json`)) {
        throw new Error("error in reading p2 package.json");
      }
      if (path.endsWith(`p3${sep}package.json`)) {
        return packageJsonList[2];
      }
      if (path.endsWith(`p2${sep}package-lock.json`)) {
        return { version: "0.0.0" };
      }
      if (path.endsWith(`p3${sep}package-lock.json`)) {
        return {
          version: "0.0.0",
          packages: { "": { version: "0.0.0" }, a: { version: "2.4.0" } }
        };
      }
    });

    const originalPackages = cloneDeep(packages);
    const packagesToUse = cloneDeep(originalPackages);

    await expect(version(dir, "1.1.0", packagesToUse)).rejects.toEqual(
      new ErrorSet([new Error("error in reading p2 package.json")])
    );

    originalPackages[2].dependencies.local.dep["@s/pkg1"] = "^1.1.0";
    expect(packagesToUse).toEqual(originalPackages);

    expect(logInfo).toHaveBeenCalledTimes(3);
    for (const i of [1, 2, 3]) {
      expect(logInfo).toHaveBeenNthCalledWith(
        i,
        `[@s/pkg${i}] Versioning: 1.1.0`
      );
    }

    expect(updateJsonFileStore).toHaveBeenCalledTimes(3);
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join(dir, "p1", "package.json"),
      {
        name: "@s/pkg1",
        version: "1.1.0"
      }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      2,
      join(dir, "p3", "package.json"),
      {
        name: "@s/pkg3",
        version: "1.1.0",
        dependencies: { "@s/pkg1": "^1.1.0" }
      }
    );
    expect(updateJsonFileStore).toHaveBeenNthCalledWith(
      3,
      join(dir, "p3", "package-lock.json"),
      {
        version: "1.1.0",
        packages: { "": { version: "1.1.0" }, a: { version: "2.4.0" } }
      }
    );

    expect(saveJsonFileStore).toHaveBeenCalledTimes(3);
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join(dir, "p1", "package.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      2,
      join(dir, "p3", "package.json")
    );
    expect(saveJsonFileStore).toHaveBeenNthCalledWith(
      3,
      join(dir, "p3", "package-lock.json")
    );
  });
});
