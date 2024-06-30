import { FakeTime } from "jsr:@std/testing/time";
import { assertStrictEquals } from "jsr:@std/assert"
import { getTimestmap } from "./time.ts"

Deno.test("utc timestamp is correct", () => {
    new FakeTime(new Date("2024-02-11T13:05:59Z"));
    const timestamp = getTimestmap()
    assertStrictEquals(timestamp, "20240211-130559")
})

Deno.test("JST timestamp is correct", () => {
    new FakeTime(new Date("2024-02-11T13:05:59+09:00"));
    const timestamp = getTimestmap()
    assertStrictEquals(timestamp, "20240211-040559")
})