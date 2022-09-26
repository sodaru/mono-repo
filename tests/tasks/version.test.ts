import { readFile } from "fs/promises";
import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { join } from "path";
import { list } from "../../src/tasks/list";
import { version } from "../../src/tasks/version";
import { logInfo } from "nodejs-cli-runner";
import { mockedFunction } from "../testutils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    logInfo: jest.fn()
  };
});

describe("Test task version", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-npm-mono-repo");
    mockedFunction(logInfo).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("without any packages", async () => {
    const packages = await list(dir);
    await expect(version(dir, "1.1.0", packages, [])).resolves.toBeUndefined();
  });

  test("with one package", async () => {
    createFiles(dir, {
      "packages/p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1"
      })
    });
    const packagesDir = join(dir, "packages");
    const packages = await list(packagesDir);
    await expect(
      version(packagesDir, "1.1.0", packages, [])
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenNthCalledWith(1, "[@s/pkg1] Versioning: 1.1.0");

    await expect(
      readFile(join(dir, "packages/p1/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg1",
          version: "1.1.0"
        },
        null,
        2
      ) + "\n"
    );
  });

  test("with multiple packages", async () => {
    createFiles(dir, {
      "packages/p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1"
      }),
      "packages/p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.1"
      })
    });
    const packagesDir = join(dir, "packages");
    const packages = await list(packagesDir);
    await expect(
      version(packagesDir, "1.1.0", packages, [])
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenNthCalledWith(1, "[@s/pkg1] Versioning: 1.1.0");
    expect(logInfo).toHaveBeenNthCalledWith(2, "[@s/pkg2] Versioning: 1.1.0");

    await expect(
      readFile(join(dir, "packages/p1/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg1",
          version: "1.1.0"
        },
        null,
        2
      ) + "\n"
    );

    await expect(
      readFile(join(dir, "packages/p2/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg2",
          version: "1.1.0"
        },
        null,
        2
      ) + "\n"
    );
  });

  test("with local and external dependencies", async () => {
    createFiles(dir, {
      "packages/p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1"
      }),
      "packages/p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.1",
        dependencies: {
          "@s/pkg1": "^1.0.1"
        },
        peerDependencies: {
          tslib: "^4.5.5"
        }
      })
    });
    const packagesDir = join(dir, "packages");
    const packages = await list(packagesDir);
    await expect(
      version(packagesDir, "1.1.0", packages, [])
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenNthCalledWith(1, "[@s/pkg1] Versioning: 1.1.0");
    expect(logInfo).toHaveBeenNthCalledWith(2, "[@s/pkg2] Versioning: 1.1.0");

    await expect(
      readFile(join(dir, "packages/p1/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg1",
          version: "1.1.0"
        },
        null,
        2
      ) + "\n"
    );

    await expect(
      readFile(join(dir, "packages/p2/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg2",
          version: "1.1.0",
          dependencies: {
            "@s/pkg1": "^1.1.0"
          },
          peerDependencies: {
            tslib: "^4.5.5"
          }
        },
        null,
        2
      ) + "\n"
    );
  });

  test("with selected packages", async () => {
    createFiles(dir, {
      "packages/p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.3"
      }),
      "packages/p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.2",
        dependencies: {
          "@s/pkg1": "^1.0.1"
        },
        peerDependencies: {
          tslib: "^4.5.5"
        }
      }),
      "packages/p3/package.json": JSON.stringify({
        name: "@s/pkg3",
        version: "1.0.3"
      })
    });
    const packagesDir = join(dir, "packages");
    const packages = await list(packagesDir);
    await expect(
      version(packagesDir, "1.0.4", packages, ["@s/pkg2"])
    ).resolves.toBeUndefined();

    expect(logInfo).toHaveBeenNthCalledWith(1, "[@s/pkg2] Versioning: 1.0.4");

    await expect(
      readFile(join(dir, "packages/p1/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg1",
          version: "1.0.3"
        },
        null,
        2
      ) + "\n"
    );

    await expect(
      readFile(join(dir, "packages/p2/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg2",
          version: "1.0.4",
          dependencies: {
            "@s/pkg1": "^1.0.3"
          },
          peerDependencies: {
            tslib: "^4.5.5"
          }
        },
        null,
        2
      ) + "\n"
    );

    await expect(
      readFile(join(dir, "packages/p3/package.json"), "utf8")
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@s/pkg3",
          version: "1.0.3"
        },
        null,
        2
      ) + "\n"
    );
  });
});
