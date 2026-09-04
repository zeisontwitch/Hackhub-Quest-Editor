import { beforeEach, describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import App from "@/App";
import { createProject } from "@/schema/project";
import { useEditor } from "@/store/editor";

beforeEach(() => { localStorage.clear(); act(() => useEditor.getState().load(createProject(), { clearHistory: true })); });

function drag(keys: {ctrl?:boolean; shift?:boolean}) {
    const pane = document.querySelector(".react-flow__pane") as HTMLElement;
    pane.getBoundingClientRect = () => ({x:0,y:0,width:1000,height:800,top:0,left:0,right:1000,bottom:800,toJSON(){}}) as DOMRect;
    const ev=(t:string,x:number,y:number)=>{const e=new MouseEvent(t,{bubbles:true,clientX:x,clientY:y,button:0,ctrlKey:!!keys.ctrl,shiftKey:!!keys.shift}) as MouseEvent&{pointerId:number;isPrimary:boolean;pointerType:string};e.pointerId=1;e.isPrimary=true;e.pointerType="mouse";return e;};
    act(()=>{window.dispatchEvent(ev("pointerdown",350,10));});
    act(()=>{pane.dispatchEvent(ev("pointerdown",350,10));});
    act(()=>{window.dispatchEvent(ev("pointermove",900,700));});
    act(()=>{pane.dispatchEvent(ev("pointermove",900,700));});
    act(()=>{window.dispatchEvent(ev("pointerup",900,700));});
    act(()=>{pane.dispatchEvent(ev("pointerup",900,700));});
}

describe("PROBE does the box drag start at all", () => {
    it("ctrl vs shift, when nodes are ALREADY selected", async () => {
        const st = useEditor.getState();
        const a = st.addNode("fx.notify", {x:0,y:0})!; const b = st.addNode("fx.notify", {x:400,y:0})!;
        render(<App />);
        await waitFor(() => expect(document.querySelectorAll(".react-flow__node").length).toBe(2));

        act(() => useEditor.getState().select({ nodeIds:[a,b], edgeIds:[] }));
        console.log("CTRL: before =", JSON.stringify(useEditor.getState().selection.nodeIds));
        drag({ctrl:true});
        console.log("CTRL: after  =", JSON.stringify(useEditor.getState().selection.nodeIds), " (want [] or [a] - something removed)");

        act(() => useEditor.getState().select({ nodeIds:[a,b], edgeIds:[] }));
        console.log("SHIFT: before =", JSON.stringify(useEditor.getState().selection.nodeIds));
        drag({shift:true});
        console.log("SHIFT: after  =", JSON.stringify(useEditor.getState().selection.nodeIds));
        console.log("a=",a,"b=",b);
        expect(true).toBe(true);
    });
});
