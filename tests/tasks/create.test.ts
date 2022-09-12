import { childProcess } from "nodejs-cli-runner";
import { createTempDir, deleteDir } from "nodejs-file-utils";
import { join } from "path";
import { create } from "../../src/tasks/create";
import { mockedFunction } from "../testutils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    childProcess: jest.fn()
  };
});

describe("Test task create", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-mono-repo");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("test create", async () => {
    mockedFunction(childProcess).mockResolvedValue(undefined);
    await expect(create(dir, "p1")).resolves.toBeUndefined();
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      join(dir, "p1"),
      process.platform == "win32" ? "npm.cmd" : "npm",
      ["init"],
      { show: "on", return: "off" },
      { show: "on", return: "off" },
      undefined
    );
  });
});
