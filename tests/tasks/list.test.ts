import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { list } from "../../src/tasks/list";
import { Package } from "../../src/types";

describe("Test task list", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty dir", async () => {
    await expect(list(dir)).resolves.toEqual([]);
  });

  test("with one package", async () => {
    createFiles(dir, {
      "p1/package.json": JSON.stringify({ name: "@s/pkg1", version: "1.0.1" })
    });
    await expect(list(dir)).resolves.toEqual([
      {
        name: "@s/pkg1",
        version: "1.0.1",
        dirName: "p1",
        dependencies: { local: {}, external: {} }
      } as Package
    ]);
  });

  test("with one package and external dependencies", async () => {
    createFiles(dir, {
      "p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1",
        dependencies: { lodash: "^1.0.0" }
      })
    });
    await expect(list(dir)).resolves.toEqual([
      {
        name: "@s/pkg1",
        version: "1.0.1",
        dirName: "p1",
        dependencies: { local: {}, external: { dep: { lodash: "^1.0.0" } } }
      } as Package
    ]);
  });

  test("with two packages and only external dependencies", async () => {
    createFiles(dir, {
      "p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1",
        dependencies: { lodash: "^1.0.0" }
      }),
      "p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.2",
        dependencies: { lodash: "^1.0.0", rimraf: "^1.0.1" }
      })
    });
    await expect(list(dir)).resolves.toEqual([
      {
        name: "@s/pkg1",
        version: "1.0.1",
        dirName: "p1",
        dependencies: { local: {}, external: { dep: { lodash: "^1.0.0" } } }
      } as Package,
      {
        name: "@s/pkg2",
        version: "1.0.2",
        dirName: "p2",
        dependencies: {
          local: {},
          external: { dep: { lodash: "^1.0.0", rimraf: "^1.0.1" } }
        }
      } as Package
    ]);
  });

  test("with two packages and only local dependencies", async () => {
    createFiles(dir, {
      "p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1",
        dependencies: {}
      }),
      "p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.1",
        dependencies: { "@s/pkg1": "^1.0.1" }
      })
    });
    await expect(list(dir)).resolves.toEqual([
      {
        name: "@s/pkg1",
        version: "1.0.1",
        dirName: "p1",
        dependencies: { local: {}, external: {} }
      } as Package,
      {
        name: "@s/pkg2",
        version: "1.0.1",
        dirName: "p2",
        dependencies: {
          local: { dep: { "@s/pkg1": "^1.0.1" } },
          external: {}
        }
      } as Package
    ]);
  });

  test("with peer and dev dependencies", async () => {
    createFiles(dir, {
      "p1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1",
        dependencies: {},
        devDependencies: { typescript: "^4.2.1" }
      }),
      "p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.1",
        devDependencies: { "@s/pkg1": "^1.0.1" },
        peerDependencies: { "@s/pkg1": "^1.0.1", tslib: "^1.0.0" }
      })
    });
    await expect(list(dir)).resolves.toEqual([
      {
        name: "@s/pkg1",
        version: "1.0.1",
        dirName: "p1",
        dependencies: { local: {}, external: { dev: { typescript: "^4.2.1" } } }
      } as Package,
      {
        name: "@s/pkg2",
        version: "1.0.1",
        dirName: "p2",
        dependencies: {
          local: {
            dev: { "@s/pkg1": "^1.0.1" },
            peer: { "@s/pkg1": "^1.0.1" }
          },
          external: { peer: { tslib: "^1.0.0" } }
        }
      } as Package
    ]);
  });
});
