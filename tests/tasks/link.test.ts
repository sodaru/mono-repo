import {
  createTempDir,
  deleteDir,
  createFiles,
  readFiles
} from "nodejs-file-utils";
import { lstat } from "fs/promises";
import { join } from "path";
import { link } from "../../src/tasks/link";

describe("Test task link", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty packages", async () => {
    await expect(link(dir, [])).resolves.toBeUndefined();
  });

  test("with some packages to link", async () => {
    const files = {
      "p1/package.json": JSON.stringify({ name: "@s/pkg1", version: "1.0.1" }),
      "p2/package.json": JSON.stringify({
        name: "@s/pkg2",
        version: "1.0.1",
        devDependencies: { tslib: "^2.4.0" }
      }),
      "p3/package.json": JSON.stringify({
        name: "@s/pkg3",
        version: "1.0.1",
        dependencies: { "@s/pkg1": "^1.0.1" }
      })
    };
    createFiles(dir, files);

    await expect(
      link(dir, [
        {
          name: "@s/pkg1",
          dirName: "p1",
          dependencies: { local: {}, external: {} }
        },
        {
          name: "@s/pkg2",
          dirName: "p2",
          dependencies: { local: {}, external: { dev: { tslib: "^2.4.0" } } }
        },
        {
          name: "@s/pkg3",
          dirName: "p3",
          dependencies: {
            local: { dep: { "@s/pkg1": "^1.0.1" } },
            external: {}
          }
        }
      ])
    ).resolves.toBeUndefined();

    const stats = await lstat(join(dir, "p3/node_modules/@s/pkg1"));
    expect(stats.isSymbolicLink()).toBeTruthy();

    expect(readFiles(dir)).toEqual({
      ...files,
      "p3/node_modules/@s/pkg1/package.json": JSON.stringify({
        name: "@s/pkg1",
        version: "1.0.1"
      })
    });
  });
});
