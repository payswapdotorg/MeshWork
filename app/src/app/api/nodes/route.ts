import { NextResponse } from "next/server";
import { DESIGN_NODES, NODE_PERMISSION_NOTE, NODE_PERMISSIONS } from "@/lib/meshwork/data";
import type { NodesVM } from "@/lib/meshwork/types";

export async function GET() {
  const payload: NodesVM = {
    nodes: DESIGN_NODES,
    permissions: NODE_PERMISSIONS,
  };
  return NextResponse.json({ ...payload, note: NODE_PERMISSION_NOTE });
}
