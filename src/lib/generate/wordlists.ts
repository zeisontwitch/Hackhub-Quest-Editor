/**
 * The raw material the field generators compose from (r161).
 *
 * Deliberately data-only — no logic — in the tone of the shipped templates
 * (diverse, plausible, and clearly fictional for anything implying a real
 * person or provider). Each generator in `./index.ts` pulls from the lists it
 * needs and assembles the value a field wants, so we never store a flat
 * `firstname+lastname` product: the parts recombine into far more than any one
 * list could hold.
 *
 * Every list is `as const` and covered by a non-empty / de-duplicated test.
 */

/** Given names, drawn from many regions so a quest cast is not monocultural. */
export const FIRST_NAMES = [
    "Ada", "Adaeze", "Anselm", "Bao", "Bjorn", "Camille", "Cassia", "Chidi",
    "Clara", "Dario", "Delphine", "Dilara", "Edith", "Elias", "Emre", "Esme",
    "Fatima", "Felix", "Freya", "Gabriel", "Halvard", "Hana", "Hedda", "Ines",
    "Ingrid", "Isla", "Ivo", "Jae", "Johan", "Juno", "Kaito", "Kemal", "Kira",
    "Lars", "Leila", "Linnea", "Lucia", "Mads", "Marguerite", "Mateo", "Mercy",
    "Milo", "Nadia", "Nikolai", "Noor", "Olamide", "Oskar", "Petra", "Priya",
    "Rafael", "Rhea", "Rosa", "Sanne", "Selin", "Sigrid", "Simone", "Soren",
    "Stine", "Taavi", "Tariq", "Thandiwe", "Tomas", "Ugo", "Vera", "Viktor",
    "Wren", "Xiomara", "Yara", "Yusuf", "Zainab", "Zara", "Zoltan",
] as const;

/** Family names, likewise spread across naming traditions. */
export const LAST_NAMES = [
    "Adler", "Amara", "Bakker", "Brandt", "Calloway", "Carrasco", "Chen",
    "Dabiri", "Delgado", "Eriksson", "Faber", "Falk", "Frost", "Gallo",
    "Haas", "Hoffmann", "Ilves", "Iqbal", "Jansen", "Kaur", "Klein", "Kovac",
    "Lindqvist", "Malone", "Marchetti", "Mbeki", "Moreau", "Nakamura", "Novak",
    "Oduya", "Okafor", "Okonkwo", "Oyelaran", "Petrov", "Quinlan", "Reyes",
    "Ritter", "Rossi", "Sartorius", "Schmidt", "Serrano", "Sorensen", "Tanaka",
    "Vann", "Vega", "Verhoeven", "Voss", "Wallace", "Yildiz", "Zhao",
] as const;

/** Leading word of a fictional company name (composed with a tail below). */
export const COMPANY_HEADS = [
    "Meridian", "Greyline", "Northgate", "Harbour", "Sable", "Vantage",
    "Ironwood", "Solvent", "Beacon", "Cobalt", "Delta", "Union", "Anchor",
    "Cinder", "Halcyon", "Kestrel", "Lumen", "Onyx", "Pinnacle", "Redwood",
    "Sterling", "Tidewater", "Vertex", "Warden", "Zephyr",
] as const;

/** Trailing word of a fictional company name. */
export const COMPANY_TAILS = [
    "Capital", "Dispatch", "Logistics", "Holdings", "Systems", "Partners",
    "Freight", "Union", "Industries", "Group", "Networks", "Trust", "Labs",
    "Shipping", "Consulting", "Media", "Analytics", "Foundry", "Works",
] as const;

/** Fictional consumer e-mail providers, matching the templates' tone. */
export const MAIL_PROVIDERS = [
    "googoomail.net", "nullpost.io", "ghostmail.io", "postbox.dev",
    "mailhive.net", "quicksend.org", "inboxly.io", "cryptletter.net",
    "driftmail.co", "plainpost.net",
] as const;

/** Top-level domains used for company/host domains (matching template data). */
export const TLDS = ["net", "io", "org", "internal", "gov", "co", "dev"] as const;

/** Short server/host names for internal machines. */
export const HOSTNAME_WORDS = [
    "vault", "gw", "db", "mail", "web", "prod", "dev", "backup", "ns1",
    "fileserver", "intranet", "vpn", "proxy", "records", "billing", "hr",
    "ops", "build", "gitlab", "jump", "core", "edge", "store", "auth",
] as const;

/** Real vendor+model strings the in-game `fern` recovery route expects. */
export const ROUTER_MODELS = [
    "TP-Link Archer C6", "TP-Link Archer AX55", "MikroTik hEX S",
    "Netgear Nighthawk R7000", "Netgear Orbi RBK50", "Cisco ISR 1100",
    "Cisco RV340", "Asus RT-AX88U", "Ubiquiti EdgeRouter X",
    "Linksys WRT3200ACM", "D-Link DIR-882", "Huawei AR617VW",
] as const;

/** Bare service labels — what nmap prints next to a port. */
export const SERVICE_NAMES = [
    "http", "https", "ssh", "ftp", "mysql", "postgresql", "smtp", "dns",
    "redis", "telnet", "rdp", "vnc", "smb",
] as const;

/**
 * Realistic service banners. Each ends in a three-number version and no letters
 * inside the version — the Version field's own rule (metasploit refuses "7.2"
 * and "7.2p2"), so a generated banner is always usable.
 */
export const SERVICE_BANNERS = [
    "OpenSSH 8.9.0", "OpenSSH 7.2.0", "OpenSSH 6.4.0", "nginx 1.14.2",
    "nginx 1.18.0", "Apache 2.4.41", "Apache 2.4.29", "ProFTPD 1.3.5",
    "vsftpd 3.0.3", "MySQL 5.7.31", "PostgreSQL 9.6.23", "PostgreSQL 12.9.0",
    "Redis 6.2.6", "Exim 4.94.0", "Postfix 3.4.14",
] as const;
