import { createTempDir, deleteDir, createFiles } from "nodejs-file-utils";
import { link } from "../src/utils";
import { join, sep } from "path";
import { readlink, symlink } from "fs/promises";

describe("Test util link", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with non-existing src", async () => {
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).rejects.toMatchObject({
      message: `ENOENT: no such file or directory, stat '${join(dir, "src")}'`
    });
  });

  test("with file at src", async () => {
    createFiles(dir, { src: "srccontext" });
    await expect(link(join(dir, "src"), join(dir, "dest"))).rejects.toEqual(
      new Error(`'${join(dir, "src")}' is not a directory`)
    );
  });

  test("with empty dir at src and no dest", async () => {
    createFiles(dir, { "src/": "" });
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).resolves.toBeUndefined();
    await expect(readlink(join(dir, "dest"))).resolves.toEqual(
      join(dir, "src") + (process.platform == "win32" ? sep : "")
    );
  });

  test("with dir at src and no dest", async () => {
    createFiles(dir, { "src/a": "a's content" });
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).resolves.toBeUndefined();
    await expect(readlink(join(dir, "dest"))).resolves.toEqual(
      join(dir, "src") + (process.platform == "win32" ? sep : "")
    );
  });

  test("with dir at src and file at dest", async () => {
    createFiles(dir, { "src/a": "a's content", dest: "dest content" });
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).resolves.toBeUndefined();
    await expect(readlink(join(dir, "dest"))).resolves.toEqual(
      join(dir, "src") + (process.platform == "win32" ? sep : "")
    );
  });

  test("with dir at src and dir at dest", async () => {
    createFiles(dir, { "src/a": "a's content", "dest/b": "b's content" });
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).resolves.toBeUndefined();
    await expect(readlink(join(dir, "dest"))).resolves.toEqual(
      join(dir, "src") + (process.platform == "win32" ? sep : "")
    );
  });

  test("with dir at src and link at dest", async () => {
    createFiles(dir, { "src/a": "a's content", "dest2/b": "b's content" });
    await symlink(join(dir, "dest2"), join(dir, "dest"), "junction");
    await expect(
      link(join(dir, "src"), join(dir, "dest"))
    ).resolves.toBeUndefined();
    await expect(readlink(join(dir, "dest"))).resolves.toEqual(
      join(dir, "src") + (process.platform == "win32" ? sep : "")
    );
  });
});
