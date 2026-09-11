/**
 * Resetting the editor's own state from the settings sheet.
 *
 * "Reset all editor preferences" puts every preference module back to its
 * shipped default by calling its own setter — the modules stay the single
 * writers of their state and storage, so nothing here can leave the two out
 * of step. The cleared draft is a separate action with its own confirm,
 * because losing a draft is a different kind of irreversible from losing a
 * look you spent a minute choosing.
 */
import { setSnapEnabled, setSnapStep } from "@/editor/canvas/snapGrid";
import { DOT_PERIOD_S, setDotPeriod, setWireMotion } from "@/editor/canvas/wireMotion";
import { defaultWirePhysics, setWirePhysicsEnabled } from "@/editor/canvas/wirePhysicsPref";
import { resetWireTuning } from "@/editor/canvas/wireTuning";
import { setTheme } from "./theme";
import { setUiFont } from "./uiFont";

/** Every preference back to what a fresh install would use. */
export function resetEditorPreferences(): void {
    setTheme("midnight");
    setUiFont("system");
    setSnapEnabled(false);
    setSnapStep(22);
    setWireMotion(true);
    // The OS reduced-motion hint is part of the fresh default, not just "on".
    setWirePhysicsEnabled(defaultWirePhysics());
    resetWireTuning();
    setDotPeriod(DOT_PERIOD_S);
}
