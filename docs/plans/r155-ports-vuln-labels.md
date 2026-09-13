# r155 — Telnet/HTTPS presets + vuln display descriptions (plan)

Queue #6, no behaviour change:

1. Presets: Telnet (23/telnet/blank — Zeis's explicit ask; the standard
   admin port, no claim about a telnet player command, which the handbook
   says is not in the verified set) and HTTPS (443/https/blank — templates
   already author `https` on 443). Blank versions per the file's own rule.
2. Vuln dropdown: `VULNERABILITY_BLURBS` in common.ts (gamer-readable
   universal meanings, e.g. RCE → "run any command"); registry options
   render "RCE (run any command)". Values unchanged → export byte-identical.
3. Tests: preset coverage + standard-port maps extended (existing generic
   guards validate the new rows); new assertions that every vuln type has a
   description and every option value is still the raw enum.
