/**
 * Field value generators for the auto-generate (dice) button (r161).
 *
 * Pure and self-contained: no React, no store, no DOM (AR1/AR8). Every function
 * takes an optional `rng` so tests can stub it and assert exact output; in the
 * app it defaults to `Math.random`. Generators *compose* from the curated lists
 * in `./wordlists.ts` rather than storing finished products, and the ones that
 * can (`email`, `username`) reuse values the author already entered nearby to
 * stay coherent — but they only ever RETURN a value, never write a field, so one
 * dice click changes exactly one field and undo stays one step.
 *
 * The output is plain text written through a field's normal `onChange`, so the
 * export is byte-identical to the author having typed it — nothing here reaches
 * the compiler, the runtime or the SDK.
 */
import {
    COMPANY_HEADS,
    COMPANY_TAILS,
    FIRST_NAMES,
    HOSTNAME_WORDS,
    LAST_NAMES,
    MAIL_PROVIDERS,
    ROUTER_MODELS,
    SERVICE_BANNERS,
    SERVICE_NAMES,
    TLDS,
} from "./wordlists";

/** A random-number source in [0, 1). Injected so tests are deterministic. */
export type Rng = () => number;

/** What a dice button produces. */
export type GeneratorKind =
    | "firstName"
    | "lastName"
    | "fullName"
    | "initialName"
    | "email"
    | "username"
    | "ip"
    | "domain"
    | "hostname"
    | "routerModel"
    | "serviceName"
    | "serviceVersion"
    | "companyName"
    | "iban";

/** Public targets read as real addresses; private ones as internal devices. */
export type IpFlavour = "public" | "private";

/**
 * Sibling values a generator may read to stay coherent (e.g. an e-mail built
 * from the first/last name beside it). Keys are field keys; missing/blank values
 * mean "compose a throwaway instead".
 */
export interface GenContext {
    firstName?: string;
    lastName?: string;
    company?: string;
}

/* ── list helpers ─────────────────────────────────────────────────────────── */

function pick<T>(list: readonly T[], rng: Rng): T {
    return list[Math.floor(rng() * list.length)];
}

/** An integer in [min, max]. */
function int(min: number, max: number, rng: Rng): number {
    return min + Math.floor(rng() * (max - min + 1));
}

/** Strip accents/non-word characters so a name is safe in an e-mail or login. */
function slug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

/* ── names ────────────────────────────────────────────────────────────────── */

export function firstName(rng: Rng = Math.random): string {
    return pick(FIRST_NAMES, rng);
}

export function lastName(rng: Rng = Math.random): string {
    return pick(LAST_NAMES, rng);
}

export function fullName(rng: Rng = Math.random): string {
    return `${firstName(rng)} ${lastName(rng)}`;
}

/** "E. Brandt" — the bank-statement / from-name style. */
export function initialName(rng: Rng = Math.random): string {
    return `${firstName(rng).charAt(0)}. ${lastName(rng)}`;
}

export function companyName(rng: Rng = Math.random): string {
    return `${pick(COMPANY_HEADS, rng)} ${pick(COMPANY_TAILS, rng)}`;
}

/* ── addresses ────────────────────────────────────────────────────────────── */

/** The domain slug a company e-mail/site uses, e.g. "meridian-capital.net". */
function companyDomain(company: string, rng: Rng): string {
    const words = company.trim().split(/\s+/).map(slug).filter(Boolean);
    const stem = words.length ? words.join("-") : slug(companyName(rng)).replace(/\s+/g, "-");
    return `${stem}.${pick(TLDS, rng)}`;
}

/**
 * An e-mail address. Reuses the first/last name in context when present, and a
 * company domain when a company is in scope — otherwise a personal provider.
 * With no names it invents throwaway ones just to compose (and discards them).
 */
export function email(ctx: GenContext = {}, rng: Rng = Math.random): string {
    const first = ctx.firstName?.trim() ? slug(ctx.firstName) : slug(firstName(rng));
    const last = ctx.lastName?.trim() ? slug(ctx.lastName) : slug(lastName(rng));

    const localStyles = [
        () => `${first}.${last}`,
        () => `${first.charAt(0)}.${last}`,
        () => `${first}${last}`,
        () => `${first}.${last}${int(2, 99, rng)}`,
        () => `${first}${int(2, 99, rng)}`,
    ];
    const local = pick(localStyles, rng)();

    const domain = ctx.company?.trim()
        ? companyDomain(ctx.company, rng)
        : pick(MAIL_PROVIDERS, rng);
    return `${local}@${domain}`;
}

/** A login name — lowercase, no spaces, reuses names when present. */
export function username(ctx: GenContext = {}, rng: Rng = Math.random): string {
    const first = ctx.firstName?.trim() ? slug(ctx.firstName) : slug(firstName(rng));
    const last = ctx.lastName?.trim() ? slug(ctx.lastName) : slug(lastName(rng));
    const styles = [
        () => `${first}${last.charAt(0)}`,
        () => `${first.charAt(0)}${last}`,
        () => `${first}.${last}`,
        () => `${first}${last}`,
        () => `${first}_${last}`,
        () => `${first}${int(2, 99, rng)}`,
    ];
    return pick(styles, rng)();
}

/** A hostname / short server name, e.g. "vault", "db-02". */
export function hostname(rng: Rng = Math.random): string {
    const word = pick(HOSTNAME_WORDS, rng);
    // Sometimes number it, the way real fleets do (db-02, web-03).
    return rng() < 0.4 ? `${word}-${String(int(1, 12, rng)).padStart(2, "0")}` : word;
}

/** A domain the player can resolve, e.g. "greyline-dispatch.net". */
export function domain(ctx: GenContext = {}, rng: Rng = Math.random): string {
    return ctx.company?.trim()
        ? companyDomain(ctx.company, rng)
        : companyDomain(companyName(rng), rng);
}

/**
 * A realistic IPv4. "public" skips private/reserved first octets so it reads as
 * a real target; "private" rolls a valid RFC-1918 block for internal devices.
 */
export function ip(flavour: IpFlavour = "public", rng: Rng = Math.random): string {
    if (flavour === "private") {
        const block = int(0, 2, rng);
        if (block === 0) return `10.${int(0, 255, rng)}.${int(0, 255, rng)}.${int(1, 254, rng)}`;
        if (block === 1) return `172.${int(16, 31, rng)}.${int(0, 255, rng)}.${int(1, 254, rng)}`;
        return `192.168.${int(0, 255, rng)}.${int(1, 254, rng)}`;
    }
    // Public: avoid 0/10/127/169.254/172.16-31/192.168 and multicast/reserved
    // (>=224) so the address always looks like a routable target.
    let first = int(1, 223, rng);
    while (first === 10 || first === 127 || first === 169 || first === 172 || first === 192) {
        first = int(1, 223, rng);
    }
    return `${first}.${int(0, 255, rng)}.${int(0, 255, rng)}.${int(1, 254, rng)}`;
}

/* ── services & finance ───────────────────────────────────────────────────── */

export function serviceName(rng: Rng = Math.random): string {
    return pick(SERVICE_NAMES, rng);
}

/** A service banner like "OpenSSH 8.9.0" — always a metasploit-safe version. */
export function serviceVersion(rng: Rng = Math.random): string {
    return pick(SERVICE_BANNERS, rng);
}

/** A plausible IBAN, e.g. "DE44 5001 0517 5407 3249 31" (format only). */
export function iban(rng: Rng = Math.random): string {
    const countries = ["DE", "NL", "FR", "GB", "SE", "ES", "IT"] as const;
    const country = pick(countries, rng);
    const check = String(int(10, 99, rng));
    const digits = Array.from({ length: 18 }, () => String(int(0, 9, rng))).join("");
    const grouped = `${check}${digits}`.replace(/(.{4})/g, "$1 ").trim();
    return `${country}${grouped}`;
}

/* ── dispatch ─────────────────────────────────────────────────────────────── */

/** Extra knobs a descriptor can pass through to a generator. */
export interface GenerateOptions {
    ipFlavour?: IpFlavour;
}

/**
 * The one entry point the UI calls: pick a generator by kind, hand it the
 * sibling context and any options, and return the produced text.
 */
export function generateField(
    kind: GeneratorKind,
    ctx: GenContext = {},
    options: GenerateOptions = {},
    rng: Rng = Math.random,
): string {
    switch (kind) {
        case "firstName":
            return firstName(rng);
        case "lastName":
            return lastName(rng);
        case "fullName":
            return fullName(rng);
        case "initialName":
            return initialName(rng);
        case "email":
            return email(ctx, rng);
        case "username":
            return username(ctx, rng);
        case "ip":
            return ip(options.ipFlavour ?? "public", rng);
        case "domain":
            return domain(ctx, rng);
        case "hostname":
            return hostname(rng);
        case "routerModel":
            return pick(ROUTER_MODELS, rng);
        case "serviceName":
            return serviceName(rng);
        case "serviceVersion":
            return serviceVersion(rng);
        case "companyName":
            return companyName(rng);
        case "iban":
            return iban(rng);
        default: {
            const exhaustive: never = kind;
            return String(exhaustive);
        }
    }
}
