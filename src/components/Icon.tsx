/**
 * A small inline icon set.
 *
 * Kept in-repo rather than pulled from a package: the editor needs ~45 glyphs, the
 * bundle stays small, and the strokes inherit `currentColor` so node category
 * colours apply for free.
 */
import type { SVGProps } from "react";

const PATHS: Record<string, string> = {
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
    refresh: "M3 12a9 9 0 0 1 15.5-6.2L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15.5 6.2L3 16 M3 21v-5h5",
    check: "M20 6 9 17l-5-5",
    x: "M18 6 6 18 M6 6l12 12",
    target:
        "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    zap: "M13 2 3 14h8l-1 8 10-12h-8l1-8Z",
    network: "M9 3h6v4H9z M3 17h5v4H3z M16 17h5v4h-5z M12 7v4 M12 11H5.5v6 M12 11h6.5v6",
    wifi: "M5 12.5a11 11 0 0 1 14 0 M1.5 9a16 16 0 0 1 21 0 M8.5 16.1a6 6 0 0 1 7 0 M12 20h.01",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    plug: "M9 2v6 M15 2v6 M6 8h12v3a6 6 0 0 1-12 0V8Z M12 17v5",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z",
    database:
        "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    terminal: "M4 17l6-5-6-5 M12 19h8",
    mail: "M3 5h18v14H3z M3 6l9 7 9-7",
    phone: "M6 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z",
    message: "M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.3 8.3 0 0 1 3.6 11 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z",
    hash: "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
    bird: "M22 4c-2 1-3.5 1-5 1a6 6 0 0 0-10 4.5C5 9.5 4 8.5 3 7.5c0 5 4 9 9 9 5.5 0 9-4.5 9-10 1.2-1 1.9-2.2 1-2.5Z",
    keyboard: "M3 6h18v12H3z M7 10h.01 M11 10h.01 M15 10h.01 M7 14h10",
    key: "M14.5 3.5a5.5 5.5 0 1 1-4.2 9H7l-1 2H4v3H2v-4.5L9 10.8A5.5 5.5 0 0 1 14.5 3.5Z M17 7.5h.01",
    coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v10 M9.5 9.5A2.5 2 0 0 1 12 8c1.4 0 2.5.9 2.5 2s-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2a2.5 2 0 0 0 2.5-1.5",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8 M7 3v5h8",
    link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z",
    branch: "M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 9a9 9 0 0 1-9 9",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
    hourglass: "M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22 M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2",
    shuffle: "M16 3h5v5 M4 20 21 3 M21 16v5h-5 M15 15l6 6 M4 4l5 5",
    note: "M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-6-6Z M14 3v7h7",
    /* A magnifier over a line: a checkpoint that looks at what is passing. */
    bug: "M11 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z M14.5 13.5 20 19 M3 20h6",
    plus: "M12 5v14 M5 12h14",
    trash: "M3 6h18 M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    undo: "M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
    redo: "M15 14l5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3",
    download: "M12 3v12 M7 11l5 5 5-5 M4 21h16",
    upload: "M12 21V9 M7 13l5-5 5 5 M4 3h16",
    sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
    chevronDown: "M6 9l6 6 6-6",
    chevronRight: "M9 6l6 6-6 6",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
    copy: "M9 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9Z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    alert: "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16v-4 M12 8h.01",
    lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
    sparkle:
        "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15Z",
    play: "M6 4l14 8-14 8V4Z",
    pause: "M8 4h3v16H8z M13 4h3v16h-3z",
    file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z M14 3v6h6",
    package: "M21 8 12 3 3 8v8l9 5 9-5V8Z M3 8l9 5 9-5 M12 13v8",
    panelLeft: "M3 3h18v18H3z M9 3v18",
    panelRight: "M3 3h18v18H3z M15 3v18",
    grip: "M9 5h.01 M9 12h.01 M9 19h.01 M15 5h.01 M15 12h.01 M15 19h.01",
    more: "M5 12h.01 M12 12h.01 M19 12h.01",
    maximize: "M8 3H5a2 2 0 0 0-2 2v3 M16 3h3a2 2 0 0 1 2 2v3 M21 16v3a2 2 0 0 1-2 2h-3 M3 16v3a2 2 0 0 0 2 2h3",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    code: "M16 18l6-6-6-6 M8 6l-6 6 6 6",
    list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
    arrowRight: "M5 12h14 M13 6l6 6-6 6",
    layers: "M12 2 2 7l10 5 10-5-10-5Z M2 17l10 5 10-5 M2 12l10 5 10-5",
    filter: "M3 4h18l-7 8v7l-4 2v-9L3 4Z",
    /* Two boxes side by side on a shared centre line: nodes aligned in a row. */
    rows: "M3 12h18 M6 8h4v8H6z M14 8h4v8h-4z",
    /* Two boxes stacked on a shared centre line: nodes aligned in a column. */
    columns: "M12 3v18 M8 6h8v4H8z M8 14h8v4H8z",
    /* Outer bars fixed, middle bar centred: even horizontal gaps. */
    "spread-h": "M4 4v16 M20 4v16 M11 8h2v8h-2z",
    /* The same, turned: even vertical gaps. */
    "spread-v": "M4 4h16 M4 20h16 M8 11v2h8v-2z",
    grid: "M3 9h18 M3 15h18 M9 3v18 M15 3v18",
};

/**
 * Filled glyphs that don't fit the single-stroke line-art model above: they
 * carry their own `viewBox` and one or more `fill`ed sub-paths (drawn in
 * `currentColor`, no stroke). The dice reads as "randomize" — a tumbling die —
 * which a stroked square could not (a plain square looked like a text box).
 */
const FILLED_ICONS: Record<string, { viewBox: string; paths: string[] }> = {
    dice: {
        viewBox: "0 0 32 32",
        paths: [
            "M7.98815 13.8772C8.09168 14.9779 7.50506 15.9307 6.68549 15.9964 5.86592 16.0621 5.11537 15.2243 5.01185 14.1237 4.90832 13.023 5.49494 12.0702 6.31451 12.0045 7.13408 11.9306 7.88463 12.7684 7.98815 13.8772ZM12.6855 25.9964C13.5051 25.9307 14.0917 24.9779 13.9882 23.8773 13.8846 22.7684 13.1341 21.9306 12.3145 22.0045 11.4949 22.0702 10.9083 23.023 11.0118 24.1237 11.1154 25.2243 11.8659 26.0621 12.6855 25.9964ZM25.6855 12.0036C26.5051 12.0693 27.0917 13.0221 26.9882 14.1228 26.8846 15.2316 26.1341 16.0694 25.3145 15.9955 24.4949 15.9298 23.9083 14.977 24.0118 13.8763 24.1154 12.7757 24.8659 11.9379 25.6855 12.0036ZM23.9882 19.1228C24.0917 18.0221 23.5051 17.0693 22.6855 17.0036 21.8659 16.9379 21.1154 17.7757 21.0118 18.8763 20.9083 19.977 21.4949 20.9298 22.3145 20.9955 23.1341 21.0694 23.8846 20.2316 23.9882 19.1228ZM19.6855 22.0036C20.5051 22.0693 21.0917 23.0221 20.9882 24.1227 20.8846 25.2316 20.1341 26.0694 19.3145 25.9955 18.4949 25.9298 17.9083 24.977 18.0118 23.8763 18.1154 22.7757 18.8659 21.9379 19.6855 22.0036Z",
            "M13.8828 2.45108L4.49429 6.50391C4.27506 6.60214 4.07814 6.73458 3.90475 6.89358C2.84693 7.15621 2 8.10306 2 9.32352V23.4931C2 24.6841 2.70455 25.7624 3.79533 26.2406L13.4961 30.494C13.7933 30.6243 14.0969 30.692 14.3951 30.7049C15.4393 31.0984 16.5607 31.0984 17.6049 30.7049C17.9031 30.692 18.2067 30.6243 18.5039 30.494L28.2047 26.2406C29.2954 25.7624 30 24.6841 30 23.4931V9.32352C30 8.15045 29.2176 7.23015 28.2175 6.92724C28.0446 6.75323 27.8417 6.609 27.6071 6.50391L18.1171 2.45108C16.778 1.84964 15.2408 1.84964 13.8828 2.45108ZM15 14.8091V28.2045C15 28.5652 14.6296 28.8072 14.2992 28.6624L4.59844 24.409C4.23485 24.2495 4 23.8901 4 23.4931V9.32352C4 8.96038 4.37489 8.71836 4.70583 8.86785L13.8233 12.9864C14.5396 13.31 15 14.0231 15 14.8091ZM17 28.2045V14.8091C17 14.0231 17.4604 13.31 18.1767 12.9864L27.2942 8.86785C27.6251 8.71836 28 8.96038 28 9.32352V23.4931C28 23.8901 27.7651 24.2495 27.4016 24.409L17.7008 28.6624C17.3704 28.8072 17 28.5652 17 28.2045ZM16 7.5C14.3431 7.5 13 7.05229 13 6.5C13 5.94771 14.3431 5.5 16 5.5C17.6568 5.5 19 5.94771 19 6.5C19 7.05229 17.6568 7.5 16 7.5Z",
        ],
    },
};

export type IconName = keyof typeof PATHS | keyof typeof FILLED_ICONS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
    name: IconName | string;
    size?: number;
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
    const filled = FILLED_ICONS[name];
    if (filled) {
        return (
            <svg
                width={size}
                height={size}
                viewBox={filled.viewBox}
                fill="currentColor"
                stroke="none"
                aria-hidden="true"
                focusable="false"
                {...rest}
            >
                {filled.paths.map((d, i) => (
                    <path key={i} d={d} />
                ))}
            </svg>
        );
    }
    const d = PATHS[name] ?? PATHS.info;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...rest}
        >
            <path d={d} />
        </svg>
    );
}
