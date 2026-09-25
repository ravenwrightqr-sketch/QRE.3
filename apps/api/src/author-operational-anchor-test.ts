import { testInventedOperationalAnchorReason } from "../src/services/authorCreative.js";

const reality = (text: string) => [
  { id: "event-1", text },
];

const cases = [
  {
    name: "reject invented torque",
    candidate: "Torque set to 3.2 Nm.",
    supplied: "Tightened kitchen cabinet hinge.",
    expectReject: true,
  },
  {
    name: "reject invented flow rate",
    candidate: "Flow rate: 7.1 L/min.",
    supplied: "Tested faucet.",
    expectReject: true,
  },
  {
    name: "reject invented volume",
    candidate: "Water replenished: 250 ml.",
    supplied: "Refilled water.",
    expectReject: true,
  },
  {
    name: "allow supplied torque",
    candidate: "Torque set to 3.2 Nm.",
    supplied: "Torque set to 3.2 Nm.",
    expectReject: false,
  },
];

let failed = false;

for (const test of cases) {
  const reason = testInventedOperationalAnchorReason(
    test.candidate,
    reality(test.supplied),
  );

  const rejected = Boolean(reason);
  const pass = rejected === test.expectReject;

  console.log(
    `${pass ? "PASS" : "FAIL"} | ${test.name} | ${reason ?? "allowed"}`,
  );

  if (!pass) failed = true;
}

if (failed) {
  process.exitCode = 1;
}