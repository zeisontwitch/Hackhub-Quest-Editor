import "@testing-library/jest-dom/vitest";

// React Flow measures nodes via ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// React Flow reads these when laying out the viewport.
if (!("DOMMatrixReadOnly" in globalThis)) {
    class DOMMatrixReadOnlyStub {
        m22 = 1;
        constructor(_?: string) {}
    }
    Object.defineProperty(globalThis, "DOMMatrixReadOnly", {
        value: DOMMatrixReadOnlyStub,
        configurable: true,
    });
}

if (typeof window !== "undefined") {
    window.matchMedia ??= ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}

// Browsers always set a dispatched MouseEvent's `view` to the window the event
// dispatches through. jsdom cannot express that: its webidl check rejects every
// reachable window object ("member view is not of type Window" — only jsdom's
// own raw wrapper passes, and which module copy holds its registry differs run
// to run), and user-event then pins `view: null` onto every mouse event with a
// NON-configurable getter, so the property cannot be assigned afterwards.
// d3-drag reads `event.view` on mousedown (nodrag(view) → view.document), so
// canvas gesture tests threw "Cannot read properties of null" inside event
// listeners for events no real browser can produce — and those throws aborted
// the drag handlers mid-gesture, hiding real behaviour from four tests.
//
// Fix, in two parts:
// 1. While user-event is loading, swallow exactly its one `view` definition on
//    MouseEvents (a get-only pin of null); everything else passes through.
//    The event then has NO own `view`, so the prototype getter answers null
//    until dispatch.
// 2. At dispatch time — after every producer is done mutating — give any
//    view-less MouseEvent an own `view` of the window: the object a real
//    browser would have handed d3. Nobody re-validates it post-construction,
//    and d3 only reads `.document` off it and hangs its drag listeners on it.
const rawDefineProperty = Object.defineProperty;
const swallowViewPin = (orig: typeof Object.defineProperty) => {
    const patched = function (o: object, key: PropertyKey, desc: PropertyDescriptor) {
        if (
            key === "view" &&
            typeof window !== "undefined" &&
            o instanceof MouseEvent &&
            desc &&
            typeof desc.get === "function"
        ) {
            /* user-event pinning view: null — skip; dispatch supplies the view. */
            return o;
        }
        return orig(o, key, desc);
    };
    return patched as typeof Object.defineProperty;
};
Object.defineProperty = swallowViewPin(rawDefineProperty);

if (typeof window !== "undefined") {
    const rawDispatchEvent = window.EventTarget.prototype.dispatchEvent;
    window.EventTarget.prototype.dispatchEvent = function (event: Event) {
        if (event instanceof MouseEvent && (event as MouseEvent).view == null) {
            try {
                rawDefineProperty(event, "view", {
                    value: window,
                    configurable: true,
                    enumerable: true,
                    writable: false,
                });
            } catch {
                /* not shadowable on this event; leave the spec default */
            }
        }
        return rawDispatchEvent.call(this, event);
    };
}
