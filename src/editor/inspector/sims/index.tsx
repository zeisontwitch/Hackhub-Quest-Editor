/**
 * Dedicated, game-styled editors for the communication nodes. Everything else
 * keeps the registry-driven generic fields.
 */
import type { ComponentType } from "react";
import type { NodeDoc, NodeType } from "@/schema/nodes";
import { DialogueNodeEditor } from "./DialogueNodeEditor";
import { PackDataEditor } from "./PackDataEditor";

type SimEditor = ComponentType<{ node: NodeDoc }>;

export const NODE_SIM_EDITORS: Partial<Record<NodeType, SimEditor>> = {
    "comms.dialogue": DialogueNodeEditor as SimEditor,
    "world.packData": PackDataEditor as SimEditor,
};
