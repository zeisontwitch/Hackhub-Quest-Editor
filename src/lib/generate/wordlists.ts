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
 * The software a service commonly runs, keyed by the bare service label an
 * author types (what nmap prints). The version generator picks a name from here
 * to match the port's service, then appends a freshly rolled, rule-compliant
 * version — so the banner reads like a real `nmap -sV` line (e.g. "OpenSSH
 * 8.4.71" for an ssh port).
 */
export const SERVICE_SOFTWARE: Record<string, readonly string[]> = {
    ssh: ["OpenSSH", "Dropbear"],
    http: ["Apache", "nginx", "lighttpd"],
    https: ["Apache", "nginx"],
    ftp: ["vsftpd", "ProFTPD", "Pure-FTPd"],
    ftps: ["vsftpd", "ProFTPD"],
    mysql: ["MySQL", "MariaDB"],
    postgresql: ["PostgreSQL"],
    postgres: ["PostgreSQL"],
    smtp: ["Postfix", "Exim", "Sendmail"],
    dns: ["BIND", "dnsmasq"],
    redis: ["Redis"],
    telnet: ["Linux telnetd"],
    rdp: ["xrdp"],
    vnc: ["TightVNC", "RealVNC"],
    smb: ["Samba"],
    imap: ["Dovecot"],
    pop3: ["Dovecot"],
};

/** Fallback software names when the service is blank or unrecognised. */
export const GENERIC_SOFTWARE = [
    "OpenSSH", "nginx", "Apache", "vsftpd", "MySQL", "PostgreSQL", "Redis",
    "Postfix", "Samba", "Dovecot",
] as const;

/** Wi-Fi network name (SSID) stems — the human-visible part before a suffix. */
export const SSID_WORDS = [
    "HOME", "NETGEAR", "LINKSYS", "TP-LINK", "XFINITY", "ORBI", "PROXIMUS",
    "NEIGHBOUR", "OFFICE", "GUEST", "SKYNET", "DOCKNET", "PORTSIDE", "ATRIUM",
    "BLUEBOX", "FIBRE", "HOTSPOT", "WARDEN", "STUDIO", "LOFT",
] as const;

/** Suffixes appended to an SSID, the way real access points name themselves. */
export const SSID_SUFFIXES = ["_5G", "_5Ghz", "_2.4G", "-Guest", "_EXT", "", ""] as const;
