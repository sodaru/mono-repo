import { doesVersionsMatch } from "../../src/tasks/doesVersionsMatch";

describe("Test task doesVersionMatch", () => {
  test("for empty packages", async () => {
    await expect(doesVersionsMatch([], [], [])).resolves.toBeUndefined();
  });

  test("for packages without dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: { local: {}, external: {} }
          }
        ],
        [],
        []
      )
    ).resolves.toBeUndefined();
  });

  test("for package without conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1" },
                peer: { typescript: "^4.5.1", tslib: "^2.3.4" }
              }
            }
          }
        ],
        [],
        []
      )
    ).resolves.toBeUndefined();
  });

  test("for multiple packages without conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1" },
                peer: { typescript: "^4.5.1", tslib: "^2.3.4" }
              }
            }
          },
          {
            name: "@s/pkg2",
            dirName: "p2",
            dependencies: {
              local: { dev: { "@s/pkg1": "^1.0.0" } },
              external: {
                dep: {},
                dev: {
                  typescript: "^4.5.1",
                  lodash: "^1.0.0",
                  tslib: "^2.3.4"
                }
              }
            }
          }
        ],
        [],
        []
      )
    ).resolves.toBeUndefined();
  });

  test("for package with conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1" },
                peer: { typescript: "^4.5.2", tslib: "^2.3.4" }
              }
            }
          }
        ],
        [],
        []
      )
    ).rejects.toEqual(
      new Error(
        "typescript has conflicting versions at\n^4.5.1 - dev  - @s/pkg1\n^4.5.2 - peer - @s/pkg1"
      )
    );
  });

  test("for multiple packages with conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1", lodash: "^1.0.0" },
                peer: { typescript: "^4.5.1", tslib: "^2.3.4" }
              }
            }
          },
          {
            name: "@s/pkg2",
            dirName: "p2",
            dependencies: {
              local: { dev: { "@s/pkg1": "^1.0.0" } },
              external: {
                dep: { lodash: "^1.1.21" },
                dev: {
                  typescript: "^4.5.1",
                  tslib: "^2.3.4"
                }
              }
            }
          }
        ],
        [],
        []
      )
    ).rejects.toEqual(
      new Error(
        "lodash has conflicting versions at\n^1.0.0  - dep  - @s/pkg1\n^1.0.0  - dev  - @s/pkg1\n^1.1.21 - dep  - @s/pkg2"
      )
    );
  });

  test("for skip with conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1", lodash: "^1.0.0" },
                peer: { typescript: "^4.5.1", tslib: "^2.3.4" }
              }
            }
          },
          {
            name: "@s/pkg2",
            dirName: "p2",
            dependencies: {
              local: { dev: { "@s/pkg1": "^1.0.0" } },
              external: {
                dep: { lodash: "^1.1.0" },
                dev: {
                  typescript: "^4.5.1",
                  tslib: "^2.3.4"
                }
              }
            }
          }
        ],
        [],
        ["lodash"]
      )
    ).resolves.toBeUndefined();
  });

  test("for filters with conflicting dependencies", async () => {
    await expect(
      doesVersionsMatch(
        [
          {
            name: "@s/pkg1",
            dirName: "p1",
            dependencies: {
              local: {},
              external: {
                dep: { lodash: "^1.0.0" },
                dev: { typescript: "^4.5.1", lodash: "^1.0.0" },
                peer: { typescript: "^4.5.1", tslib: "^2.3.4" }
              }
            }
          },
          {
            name: "@s/pkg2",
            dirName: "p2",
            dependencies: {
              local: { dev: { "@s/pkg1": "^1.0.0" } },
              external: {
                dep: { lodash: "^1.1.0" },
                dev: {
                  typescript: "^4.5.1",
                  tslib: "^2.3.4"
                }
              }
            }
          },
          {
            name: "@s/pkg3",
            dirName: "p3",
            dependencies: {
              local: { dev: { "@s/pkg1": "^1.0.0" } },
              external: {
                dep: {},
                dev: {
                  typescript: "^4.5.1",
                  tslib: "^2.3.4"
                }
              }
            }
          }
        ],
        ["@s/pkg1", "@s/pkg3"],
        []
      )
    ).resolves.toBeUndefined();
  });
});
