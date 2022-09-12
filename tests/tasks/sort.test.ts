import { sort } from "../../src/tasks/sort";
import { Package } from "../../src/types";

describe("Test task sort", () => {
  // prettier-ignore
  const usecases: [
    string, // name
    Package[], // packages
    Package[], // sorted as dependencies first 
    Package[], // sorted as dependents first
  ][] = [
    ["Empty", [], [], []],
    ["One Package", 
      [{name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}], 
      [{name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}], 
      [{name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}]
    ],
    ["Two Packages", 
      [{name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}, {name: "@s/pkg2", dirName: "p2", dependencies: {local: {}, external: {}}}], 
      [{name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}, {name: "@s/pkg2", dirName: "p2", dependencies: {local: {}, external: {}}}], 
      [{name: "@s/pkg2", dirName: "p2", dependencies: {local: {}, external: {}}}, {name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: {}}}]
    ],
    ["multiple Packages with local and external dependencies", 
      [
        {name: "@s/pkg4", dirName: "p4", dependencies: {local: {}, external: { dev: { lodash:"^1.0.0"}, peer: { lodash:"^1.0.0", "@s/pk1":"^1.1.0"}}}},
        {name: "@s/pkg2", dirName: "p2", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}}, external: {}}},
        {name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: { dep: { lodash:"^1.0.0"}}}},
        {name: "@s/pkg3", dirName: "p3", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}, dev: {"@s/pkg2": "^1.2.0"}, peer: {"@s/pkg2": "^1.2.0"}}, external: {peer: {"tslib": "^2.4.0"}}}},
      ],
      [
        {name: "@s/pkg4", dirName: "p4", dependencies: {local: {}, external: { dev: { lodash:"^1.0.0"}, peer: { lodash:"^1.0.0", "@s/pk1":"^1.1.0"}}}},
        {name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: { dep: { lodash:"^1.0.0"}}}},
        {name: "@s/pkg2", dirName: "p2", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}}, external: {}}},
        {name: "@s/pkg3", dirName: "p3", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}, dev: {"@s/pkg2": "^1.2.0"}, peer: {"@s/pkg2": "^1.2.0"}}, external: {peer: {"tslib": "^2.4.0"}}}},
      ],
      [
        {name: "@s/pkg3", dirName: "p3", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}, dev: {"@s/pkg2": "^1.2.0"}, peer: {"@s/pkg2": "^1.2.0"}}, external: {peer: {"tslib": "^2.4.0"}}}},
        {name: "@s/pkg2", dirName: "p2", dependencies: {local: {dep: {"@s/pkg1": "^1.2.0"}}, external: {}}},
        {name: "@s/pkg1", dirName: "p1", dependencies: {local: {}, external: { dep: { lodash:"^1.0.0"}}}},
        {name: "@s/pkg4", dirName: "p4", dependencies: {local: {}, external: { dev: { lodash:"^1.0.0"}, peer: { lodash:"^1.0.0", "@s/pk1":"^1.1.0"}}}},
      ],
    ]

  ];

  test.each(usecases)(
    "%s in dependencies first order",
    (name, packages, expected) => {
      expect(sort(packages)).toStrictEqual(expected);
    }
  );

  test.each(usecases)(
    "%s in dependents first order",
    (name, packages, ignore, expected) => {
      expect(sort(packages, "dependentsFirst")).toStrictEqual(expected);
    }
  );
});
