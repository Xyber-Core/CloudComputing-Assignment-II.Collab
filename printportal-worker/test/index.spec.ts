
import {
    env,
    createExecutionContext,
    waitOnExecutionContext,
    SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

describe("PrintPortal Worker", () => {
    it("responds to the health check (unit style)", async () => {
        const request = new Request("https://example.com/api/health");
        const ctx = createExecutionContext();

        const response = await worker.fetch(request, env, ctx);

        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("application/json");
        expect(await response.text()).toContain("ok");
    });

    it("responds to the health check (integration style)", async () => {
        const response = await SELF.fetch(
            "https://example.com/api/health"
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("application/json");
        expect(await response.text()).toContain("ok");
    });

    it("handles CORS preflight requests", async () => {
        const request = new Request(
            "https://example.com/api/requests",
            {
                method: "OPTIONS",
                headers: {
                    Origin: "https://cloudcomputing-printportal.pages.dev",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers":
                        "content-type,x-user-id",
                },
            }
        );

        const response = await SELF.fetch(request);

        expect(response.status).toBe(204);
        expect(
            response.headers.get("Access-Control-Allow-Origin")
        ).toBe("https://cloudcomputing-printportal.pages.dev");
    });
});
