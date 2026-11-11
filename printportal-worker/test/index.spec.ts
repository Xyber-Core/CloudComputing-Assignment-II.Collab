
import {
    env,
    createExecutionContext,
    waitOnExecutionContext,
    SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import schemaSql from "../schema.sql?raw";
import worker from "../src/index";

describe("PrintPortal Worker", () => {

beforeAll(async () => {
    // Remove SQL comments and split into complete statements.
    const statements = schemaSql
        .replace(/^\s*--[^\r\n]*$/gm, "")
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);

    // Execute complete statements in order.
    await env.DB.batch(
        statements.map((sql) => env.DB.prepare(sql))
    );
});

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
        expect(response.headers.get("Access-Control-Allow-Methods")).toContain("DELETE");
        expect(response.headers.get("Access-Control-Allow-Headers")).toContain("X-User-Id");
    });

    it("allows DELETE preflight for the deployed Pages origin", async () => {
        const response = await SELF.fetch("https://example.com/api/requests/2", {
            method: "OPTIONS",
            headers: {
                Origin: "https://cloudcomputing-printportal.pages.dev",
                "Access-Control-Request-Method": "DELETE",
                "Access-Control-Request-Headers": "content-type,x-user-id",
            },
        });
        expect(response.status).toBe(204);
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://cloudcomputing-printportal.pages.dev");
        expect(response.headers.get("Access-Control-Allow-Methods")).toContain("DELETE");
    });

    it("enforces request ownership and coordinator-only rejection", async () => {
        const headers = { 'Content-Type': 'application/json', 'X-User-Id': 'customer-a' };
        const created = await SELF.fetch('https://example.com/api/requests', {
            method: 'POST', headers, body: JSON.stringify({
                campaignReference: 'WLG-WORKER-001', category: 'Flyers',
                description: 'Printed flyers for community fundraiser', priority: 'Normal',
            }),
        });
        expect(created.status).toBe(201);
        const data = await created.json() as { id: number };
        const endpoint = `https://example.com/api/requests/${data.id}`;
        const otherCustomer = await SELF.fetch(endpoint, { headers: { 'X-User-Id': 'customer-b' } });
        expect(otherCustomer.status).toBe(403);
        const rejection = await SELF.fetch(`${endpoint}/reject`, {
            method: 'POST', headers, body: JSON.stringify({ reason: 'Insufficient printing instructions' }),
        });
        expect(rejection.status).toBe(403);
        const accepted = await SELF.fetch(`${endpoint}/reject`, {
            method: 'POST', headers: { ...headers, 'X-User-Id': 'coordinator' },
            body: JSON.stringify({ reason: 'Insufficient printing instructions' }),
        });
        expect(accepted.status).toBe(200);
        const rejected = await accepted.json() as { status: string; rejectedAt: string; history: { eventType: string }[] };
        expect(rejected.status).toBe('Submitted');
        expect(rejected.rejectedAt).toBeTruthy();
        expect(rejected.history.at(-1)?.eventType).toBe('Rejected');
        const repeated = await SELF.fetch(`${endpoint}/reject`, {
            method: 'POST', headers: { ...headers, 'X-User-Id': 'coordinator' },
            body: JSON.stringify({ reason: 'Repeated rejection' }),
        });
        expect(repeated.status).toBe(409);
    });

    it("archives completed work without destroying customer-visible history", async () => {
        const headers = { 'Content-Type': 'application/json', 'X-User-Id': 'customer-b' };
        const created = await SELF.fetch('https://example.com/api/requests', {
            method: 'POST', headers, body: JSON.stringify({
                campaignReference: 'WLG-WORKER-002', category: 'Posters',
                description: 'Community poster printing', priority: 'High',
            }),
        });
        expect(created.status).toBe(201);
        const data = await created.json() as { id: number };
        const endpoint = `https://example.com/api/requests/${data.id}`;
        const coordinator = { ...headers, 'X-User-Id': 'coordinator' };
        const call = async (method: string, status?: string, assignee?: string) => SELF.fetch(endpoint, {
            method, headers: coordinator,
            ...(method === 'PATCH' ? { body: JSON.stringify({ status, assignee }) } : {}),
        });
        expect((await call('DELETE')).status).toBe(409);
        expect((await call('PATCH', 'Assigned', 'Sam Patel')).status).toBe(200);
        expect((await call('PATCH', 'In Progress')).status).toBe(200);
        expect((await call('PATCH', 'Completed')).status).toBe(200);
        const archivedResponse = await call('DELETE');
        expect(archivedResponse.status).toBe(200);
        const archived = await archivedResponse.json() as { deletedAt: string; history: { eventType: string }[] };
        expect(archived.deletedAt).toBeTruthy();
        expect(archived.history.at(-1)?.eventType).toBe('Archived');
        const stillVisible = await SELF.fetch(endpoint, { headers });
        expect(stillVisible.status).toBe(200);
        const archiveList = await SELF.fetch('https://example.com/api/requests?view=archived', { headers: coordinator });
        expect(archiveList.status).toBe(200);
        expect((await archiveList.json() as { id: number }[]).some(r => r.id === data.id)).toBe(true);
    });

});
