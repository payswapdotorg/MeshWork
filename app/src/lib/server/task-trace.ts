import { db } from "@/lib/db";

/**
 * Deterministic conversation-trace generation for a newly created task.
 *
 * Meshwork's local preview has no live agent harness attached, so a task's
 * initial trace is composed from the prompt itself following the ZCode
 * conversation row model (user → reasoning → tool rows → assistant text).
 * Rows are stored exactly like seeded traces — the task view renders both
 * identically.
 */

export function modelLabel(model: string): string {
  const known: Record<string, string> = {
    "glm-5.3-max": "GLM 5.3 Max",
    "glm-5.3-flash": "GLM 5.3 Flash",
    "glm-5.2-air": "GLM 5.2 Air",
  };
  return known[model] ?? model;
}
export async function generateTaskTrace(
  taskId: string,
  prompt: string,
  model: string
): Promise<void> {
  const existing = await db.taskMessage.count({ where: { taskId } });
  if (existing > 0) return;

  const topic = prompt.split(/[.!:?\n]/)[0].trim().slice(0, 80) || "the request";
  const words = prompt.trim().split(/\s+/).length;

  const rows: Array<{
    kind: "user" | "assistant" | "reasoning" | "tool" | "marker";
    text?: string;
    payload?: Record<string, unknown>;
    durationMs?: number;
    status?: string;
  }> = [
    { kind: "user", text: prompt },
    {
      kind: "marker",
      payload: { marker: "modelChange", label: `Using ${modelLabel(model)}` },
    },
    {
      kind: "reasoning",
      text: `Let me break "${topic}" down. I'll first check the workspace for existing context, then gather live facts before proposing anything. The prompt is ${words} word${words === 1 ? "" : "s"}, which reads like a ${words > 25 ? "detailed outcome" : "focused request"} — I'll keep scope tight and surface trade-offs explicitly.`,
      durationMs: 8000,
    },
    {
      kind: "tool",
      payload: {
        tool: "search",
        primary: topic.toLowerCase(),
        secondary: "workspace",
        status: "completed",
        args: `query: ${topic.toLowerCase()} · scope: workspace`,
        output: "docs/notes.md\ndocs/README.md\n2 files matched.",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "terminal",
        primary: "network status",
        secondary: "meshwork@node · session 01",
        status: "completed",
        output:
          "fibre0      online   300/100 Mbps   rtt 12 ms\nwlan0       online   150/30  Mbps   rtt 31 ms   (metered)\nsatellite0  online   220/25  Mbps   rtt 58 ms",
      },
    },
    {
      kind: "reasoning",
      text: "The workspace context is thin, so the plan has to stand on measurable facts: available paths, their latency and metering. I'll summarize what I can confirm now, flag what is still advertised rather than measured, and lay out the next steps for approval before changing anything.",
      durationMs: 13000,
    },
    {
      kind: "tool",
      payload: {
        tool: "todo",
        primary: "Working plan",
        status: "completed",
        output: "☐ Gather context (done)\n☐ Confirm constraints (done)\n☐ Draft plan (done)\n☐ Await approval (pending)",
      },
    },
    {
      kind: "assistant",
      text: `I've started on **${topic}** and set up the working plan.\n\n**What I confirmed:**\n- Gathered the available workspace context for this request.\n- Checked this node's live interfaces: fibre, 5G and satellite are all online with healthy latency.\n\n**Working plan:**\n1. Draft the recommendation against your constraints.\n2. Surface trade-offs explicitly — including anything that is only *advertised*, not measured.\n3. Wait for your approval before any network change.\n\nThe full plan lands in this conversation as work completes — thinking traces and tool activity stay visible here so you can follow every step.`,
    },
  ];

  const base = Date.now();
  let seq = 0;
  for (const row of rows) {
    await db.taskMessage.create({
      data: {
        taskId,
        seq: seq++,
        kind: row.kind,
        text: row.text ?? "",
        payload: JSON.stringify(row.payload ?? {}),
        durationMs: row.durationMs ?? null,
        status: row.status ?? null,
        createdAt: new Date(base + seq * 30_000),
      },
    });
  }
  await db.task.update({ where: { id: taskId }, data: { status: "completed" } });
}

/**
 * Follow-up trace for a user reply inside an existing task conversation.
 * Same row model as the initial trace — deterministic keyword heuristics pick
 * sensible tool rows so the conversation view shows a realistic
 * thinking → tool → answer sequence. No external calls.
 */
export async function generateFollowUp(
  taskId: string,
  text: string,
  model?: string
): Promise<void> {
  const last = await db.taskMessage.findFirst({ where: { taskId }, orderBy: { seq: "desc" } });
  let seq = (last?.seq ?? -1) + 1;

  const topic = text.split(/[.!?:\n]/)[0].trim().slice(0, 80) || "your question";
  const lower = text.toLowerCase();
  const wantsLookup = /compar|find|search|cheap|price|pricing|cost|option|best/.test(lower);
  const wantsNetwork = /network|connection|speed|latency|failover|aggregat|bandwidth|route/.test(lower);

  const rows: Array<{
    kind: "assistant" | "reasoning" | "tool";
    text?: string;
    payload?: Record<string, unknown>;
    durationMs?: number;
    status?: string;
  }> = [
    {
      kind: "reasoning",
      text: `The user is following up on "${topic}". The earlier context in this conversation still holds, so I'll narrow to what was just asked instead of re-running the full plan. Let me pull the current facts first, keep advertised numbers separate from measured ones, and answer directly with the trade-offs.`,
      durationMs: 6000,
    },
  ];

  if (wantsLookup) {
    rows.push({
      kind: "tool",
      payload: {
        tool: "webFetch",
        primary: `current offers · ${topic.toLowerCase().slice(0, 40)}`,
        secondary: "3 sources · refreshed just now",
        status: "completed",
        args: `url: https://offers.meshwork.local/search?q=${encodeURIComponent(topic.toLowerCase().slice(0, 40))}`,
        output:
          "Provider A — entry tier, best headline price\nProvider B — mid tier, strong fair-use terms\nProvider C — slightly higher price, cheapest overage\nCommunity pool — shared capacity, best value per GB at your volume",
      },
    });
  }
  if (wantsNetwork) {
    rows.push({
      kind: "tool",
      payload: {
        tool: "terminal",
        primary: "network status --probe",
        secondary: "meshwork@node · follow-up check",
        status: "completed",
        output:
          "fibre0   online   300/100 Mbps   rtt 12 ms   loss 0.1%\nwlan0    online   150/30  Mbps   rtt 31 ms   loss 0.8%   (metered)\nsatellite0  online 220/25  Mbps   rtt 58 ms   loss 0.4%",
      },
    });
  }
  if (!wantsLookup && !wantsNetwork) {
    rows.push({
      kind: "tool",
      payload: {
        tool: "search",
        primary: topic.toLowerCase(),
        secondary: "conversation + workspace",
        status: "completed",
        args: `query: ${topic.toLowerCase()} · scope: conversation + workspace`,
        output: "3 passages matched from this conversation.\n2 files matched in the workspace.\nMost relevant: the comparison table from the previous answer.",
      },
    });
  }

  const approvalNote = wantsNetwork
    ? "\n\nOne guardrail before anything changes: routing, failover or aggregation changes always need your explicit approval — I won't touch the network configuration until you sign off on the exact change."
    : wantsLookup
      ? "\n\nAs always, purchases and plan changes need your explicit approval first — nothing is bought or switched until you say the word."
      : "";

  rows.push({
    kind: "assistant",
    text: `**Short answer on ${topic.toLowerCase()}:** it depends on what you optimize for, and the honest ranking looks like this:\n\n- **Best value at your current usage** — the mid-tier option; per-GB it works out cheapest at the volume we measured earlier.\n- **Best headline numbers** — the top-tier option, but you pay for headroom you only touch in peak months.\n- **Lowest risk** — the slightly dearer option with the best overage and fair-use terms; it's the safe pick if you hate surprises.\n\n**Why the ranking moves:** these figures come from advertised plan data refreshed just now — effective cost depends on throttling and fair-use clauses I can't verify from here, so treat the totals as a range until we measure one real billing cycle.\n\nWant me to draft the order or switch for the option you pick?${approvalNote}`,
  });

  const base = Date.now();
  let i = 0;
  for (const row of rows) {
    await db.taskMessage.create({
      data: {
        taskId,
        seq: seq++,
        kind: row.kind,
        text: row.text ?? "",
        payload: JSON.stringify(row.payload ?? {}),
        durationMs: row.durationMs ?? null,
        status: row.status ?? null,
        createdAt: new Date(base + i++ * 500),
      },
    });
  }
}
