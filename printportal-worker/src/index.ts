interface PrintPortalEnv {
    DB: D1Database;
}

type User = {
    id: string;
    role: "Customer" | "Coordinator";
};

type PrintRequest = {
    id: number;
    customerId: string;
    campaignReference: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    assignee: string | null;
    createdAt: string;
    updatedAt: string;
};

const CATEGORIES = ["Posters", "Flyers", "Booklets"];
const PRIORITIES = ["Low", "Normal", "High"];
const STATUSES = ["Submitted", "Assigned", "In Progress", "Completed"];
const STAFF = ["Aroha Ngata", "Sam Patel", "Leilani Fono"];
const CAMPAIGN_REFERENCE = /^[A-Z0-9][A-Z0-9-]{2,29}$/;
const MAX_DESCRIPTION = 1000;

const ALLOWED_ORIGINS = [
    "https://cloudcomputing-printportal.pages.dev",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

function corsHeaders(request: Request): Headers {
    const headers = new Headers({
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
        "Access-Control-Max-Age": "86400"
    });

    const origin = request.headers.get("Origin");

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Vary", "Origin");
    }

    return headers;
}

function json(
    request: Request,
    data: unknown,
    status = 200
): Response {
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/json; charset=utf-8");

    return new Response(JSON.stringify(data), {
        status,
        headers
    });
}

function text(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function nextStatus(status: string): string | null {
    const index = STATUSES.indexOf(status);

    return index >= 0 && index < STATUSES.length - 1
        ? STATUSES[index + 1]
        : null;
}

function validateNewRequest(body: Record<string, unknown>) {
    const value = {
        campaignReference: text(body.campaignReference).toUpperCase(),
        category: text(body.category),
        description: text(body.description),
        priority: text(body.priority)
    };

    const errors: string[] = [];

    if (!CAMPAIGN_REFERENCE.test(value.campaignReference)) {
        errors.push(
            "Campaign reference must be 3-30 letters, numbers or hyphens (e.g. WLG-DEMO-001)."
        );
    }

    if (!CATEGORIES.includes(value.category)) {
        errors.push(`Category must be one of: ${CATEGORIES.join(", ")}.`);
    }

    if (!value.description || value.description.length > MAX_DESCRIPTION) {
        errors.push(
            `Description is required (max ${MAX_DESCRIPTION} characters).`
        );
    }

    if (!PRIORITIES.includes(value.priority)) {
        errors.push(`Priority must be one of: ${PRIORITIES.join(", ")}.`);
    }

    return { value, errors };
}

function validateUpdate(
    current: PrintRequest,
    body: Record<string, unknown>
) {
    const changes: Record<string, string> = {};
    const errors: string[] = [];

    if (body.assignee !== undefined) {
        const assignee = text(body.assignee);

        if (STAFF.includes(assignee)) {
            changes.assignee = assignee;
        } else {
            errors.push(`Assignee must be one of: ${STAFF.join(", ")}.`);
        }
    }

    if (body.status !== undefined) {
        const allowed = nextStatus(current.status);
        const requestedStatus = text(body.status);

        if (requestedStatus === allowed) {
            changes.status = allowed;
        } else if (allowed) {
            errors.push(
                `Status can only move from ${current.status} to ${allowed}.`
            );
        } else {
            errors.push(`${current.status} is the final status.`);
        }
    }

    if (
        changes.status === "Assigned" &&
        !(changes.assignee || current.assignee)
    ) {
        errors.push("A request needs an assignee before it can be Assigned.");
    }

    if (!errors.length && !Object.keys(changes).length) {
        errors.push("Provide an assignee and/or the next status.");
    }

    return { changes, errors };
}

async function findUser(
    env: PrintPortalEnv,
    id: string
): Promise<User | null> {
    return env.DB.prepare(
        "SELECT id, role FROM Users WHERE id = ?"
    )
        .bind(id)
        .first<User>();
}

async function getRequest(
    env: PrintPortalEnv,
    id: number
): Promise<PrintRequest | null> {
    return env.DB.prepare(
        "SELECT * FROM PrintRequest WHERE id = ?"
    )
        .bind(id)
        .first<PrintRequest>();
}

async function handleRequest(
    request: Request,
    env: PrintPortalEnv
): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(request)
        });
    }

    if (path === "/api/health" && request.method === "GET") {
        return json(request, { status: "ok" });
    }

    if (!path.startsWith("/api/requests")) {
        return json(request, { error: "Route not found." }, 404);
    }

    // Identify the demo user from the request header.
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
        return json(request, { error: "X-User-Id header is required." }, 401);
    }

    const user = await findUser(env, userId);

    if (!user) {
        return json(request, { error: "User not found." }, 401);
    }

    // GET /api/requests
    if (path === "/api/requests" && request.method === "GET") {
        const filters: Record<string, string> = {};
        const errors: string[] = [];

        for (const [key, allowed] of [
            ["status", STATUSES],
            ["category", CATEGORIES],
            ["priority", PRIORITIES]
        ] as const) {
            const value = url.searchParams.get(key);

            if (!value) continue;

            if (allowed.includes(value)) {
                filters[key] = value;
            } else {
                errors.push(
                    `Filter ${key} must be one of: ${allowed.join(", ")}.`
                );
            }
        }

        if (errors.length) {
            return json(request, { errors }, 400);
        }

        let sql = "SELECT * FROM PrintRequest WHERE 1 = 1";
        const values: string[] = [];

        if (user.role === "Customer") {
            sql += " AND customerId = ?";
            values.push(user.id);
        }

        for (const [key, value] of Object.entries(filters)) {
            sql += ` AND ${key} = ?`;
            values.push(value);
        }

        sql += " ORDER BY id DESC";

        const result = await env.DB.prepare(sql)
            .bind(...values)
            .all<PrintRequest>();

        return json(request, { requests: result.results });
    }

    // GET /api/requests/:id
    const match = path.match(/^\/api\/requests\/(\d+)$/);

    if (match && request.method === "GET") {
        const id = Number(match[1]);
        const printRequest = await getRequest(env, id);

        if (!printRequest) {
            return json(request, { error: "Request not found." }, 404);
        }

        if (
            user.role === "Customer" &&
            printRequest.customerId !== user.id
        ) {
            return json(request, { error: "Access denied." }, 403);
        }

        const history = await env.DB.prepare(
            "SELECT requestId, previousStatus, newStatus, actor, changedAt FROM StatusHistory WHERE requestId = ? ORDER BY id ASC"
        )
            .bind(id)
            .all();

        return json(request, {
            request: printRequest,
            history: history.results
        });
    }

    // POST /api/requests
    if (path === "/api/requests" && request.method === "POST") {
        if (user.role !== "Customer") {
            return json(
                request,
                { error: "Only customers can create requests." },
                403
            );
        }

        let body: Record<string, unknown>;

        try {
            body = await request.json() as Record<string, unknown>;
        } catch {
            return json(request, { error: "Invalid JSON body." }, 400);
        }

        const { value, errors } = validateNewRequest(body);

        if (errors.length) {
            return json(request, { errors }, 400);
        }

        const timestamp = new Date().toISOString();

        const created = await env.DB.prepare(`
            INSERT INTO PrintRequest (
                customerId,
                campaignReference,
                category,
                description,
                priority,
                status,
                assignee,
                createdAt,
                updatedAt
            )
            VALUES (?, ?, ?, ?, ?, 'Submitted', NULL, ?, ?)
            RETURNING *
        `)
            .bind(
                user.id,
                value.campaignReference,
                value.category,
                value.description,
                value.priority,
                timestamp,
                timestamp
            )
            .first<PrintRequest>();

        if (!created) {
            return json(
                request,
                { error: "Unable to create request." },
                500
            );
        }

        await env.DB.prepare(`
            INSERT INTO StatusHistory (
                requestId,
                previousStatus,
                newStatus,
                actor,
                changedAt
            )
            VALUES (?, NULL, 'Submitted', ?, ?)
        `)
            .bind(created.id, user.id, timestamp)
            .run();

        return json(request, { request: created }, 201);
    }

    // PATCH /api/requests/:id
    if (match && request.method === "PATCH") {
        if (user.role !== "Coordinator") {
            return json(
                request,
                { error: "Only coordinators can update requests." },
                403
            );
        }

        const id = Number(match[1]);
        const current = await getRequest(env, id);

        if (!current) {
            return json(request, { error: "Request not found." }, 404);
        }

        let body: Record<string, unknown>;

        try {
            body = await request.json() as Record<string, unknown>;
        } catch {
            return json(request, { error: "Invalid JSON body." }, 400);
        }

        const { changes, errors } = validateUpdate(current, body);

        if (errors.length) {
            return json(request, { errors }, 400);
        }

        const timestamp = new Date().toISOString();
        const fields = Object.keys(changes);
        const assignments = fields.map((field) => `${field} = ?`);

        assignments.push("updatedAt = ?");

        const values = [
            ...fields.map((field) => changes[field]),
            timestamp,
            id
        ];

        const statements = [
            env.DB.prepare(
                `UPDATE PrintRequest SET ${assignments.join(", ")} WHERE id = ?`
            ).bind(...values)
        ];

        if (
            changes.status &&
            changes.status !== current.status
        ) {
            statements.push(
                env.DB.prepare(`
                    INSERT INTO StatusHistory (
                        requestId,
                        previousStatus,
                        newStatus,
                        actor,
                        changedAt
                    )
                    VALUES (?, ?, ?, ?, ?)
                `).bind(
                    id,
                    current.status,
                    changes.status,
                    user.id,
                    timestamp
                )
            );
        }

        await env.DB.batch(statements);

        const updated = await getRequest(env, id);

        return json(request, { request: updated });
    }

    return json(request, { error: "Route not found." }, 404);
}

export default {
    async fetch(
        request: Request,
        env: PrintPortalEnv,
        ctx: ExecutionContext
    ): Promise<Response> {
        try {
            return await handleRequest(request, env);
        } catch (error) {
            console.error("PrintPortal Worker error:", error);

            return json(
                request,
                { error: "An internal server error occurred." },
                500
            );
        }
    }
} satisfies ExportedHandler<PrintPortalEnv>;