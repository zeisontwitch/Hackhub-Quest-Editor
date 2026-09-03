"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => NemesisProtocolStage1
});
module.exports = __toCommonJS(index_exports);
var import_hackhub_content_sdk22 = require("@hotbunny/hackhub-content-sdk");

// src/quests/NemesisProtocolStage1Quest.ts
var import_hackhub_content_sdk10 = require("@hotbunny/hackhub-content-sdk");

// src/networks/MarekNetwork.ts
var import_hackhub_content_sdk = require("@hotbunny/hackhub-content-sdk");
function createMarekNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk.Network.randomIp(),
    firewallIp: import_hackhub_content_sdk.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk.Network.randomIp(),
    marekNodeIp: import_hackhub_content_sdk.Network.randomIp(),
    bunkerIp: import_hackhub_content_sdk.Network.randomIp()
  };
}
function createMarekNetwork(ips = createMarekNetworkIps()) {
  const { routerIp, firewallIp, splitterIp, marekNodeIp, bunkerIp } = ips;
  const marekDocuments = [
    {
      name: "05.17.2026",
      extension: "txt",
      data: `I do not write this as a scientist anymore.

I write this as a witness.

For most of my life, I believed that truth had weight. I believed that if evidence was measured carefully enough, recorded cleanly enough, repeated enough times under enough instruments, then truth would eventually become too heavy to bury.

I was wrong.

The government does not bury truth by denying it. That would be too simple, too clumsy, too visible. They bury truth by surrounding it with better-funded lies. They give the public a softer story, then another, then another, until the original fact becomes unrecognizable beneath all that official polish.

I helped them polish it.

That is the confession I carry.

For years, I told myself I was protecting people. I signed documents that used clean language for filthy things. I allowed committees to rename disasters as containment exercises. I watched anomalies become calibration errors, bodies become personnel losses, and living terror become classified instability.

Every lie had a stamp.
Every stamp had a signature.
Too many of them had mine.

My purpose now is simple: I will tear open the archive.`
    },
    {
      name: "05.24.2026",
      extension: "txt",
      data: `I would be lying if I said I do not feel wrath. I feel it every morning before my hands stop shaking. I feel it when I remember the faces of the researchers who disappeared from official timelines. I feel it when I hear ministers speak of safety while ordering surveillance against their own citizens. I feel it when newspapers repeat phrases that were written first in government briefing rooms.

Their lies are not mistakes. They are weapons.

They fabricate calm.
They fabricate enemies.
They fabricate consent.
They fabricate history itself, then dare to call us unstable when we remember the first version.

I tried to go to the media.

That failure still burns.

I gathered what I could: copies of reports, redacted personnel lists, dead-drop photographs, technical notes, names, dates, signatures, the first strands of Operation Nemesis. I believed that once even one journalist saw the pattern, the story would break through.

No one would touch it.

One editor listened for nine minutes and then asked if I understood what I was accusing. Another told me that stories involving government agencies, NASA-linked programs, and CERN security review would require verification from the same offices accused in the documents. A third source agreed to meet me, then vanished from the building directory by morning.

The most honest answer came from a young producer with tired eyes.

\u201CNo press office will go against them without protection,\u201D she said. \u201CAnd no one powerful will protect us from this.\u201D

So the first attempt died before it reached air.

No broadcast.
No front page.
No hearing.
No public inquiry.

Only silence, dressed in procedure.`
    },
    {
      name: "06.02.2026",
      extension: "txt",
      data: `For one night, I nearly accepted defeat. I sat in a rented room with a dead phone, two bags of evidence, and the old thought that has hunted me for years: perhaps the world does not want to be free. Perhaps comfort is stronger than truth. Perhaps people prefer the cage, provided the cage has warm lighting and familiar music.

But that was cowardice speaking in my voice.

The world is not asleep because it wants chains. It is asleep because the alarm has been stolen.

That is why I must continue.

If the official channels are sealed, I will use unofficial ones. If the press fears them, I will bypass the press. If every institution has been trained to kneel, then I will speak through the cracks between institutions. I will scatter the records where they cannot recover them all. I will make the lie too expensive to maintain.

I am seventy years old. My enemies think that makes me fragile.

They mistake age for surrender.

Age has burned away my patience. Age has stripped me down to the last few things that still matter: memory, responsibility, and the unbearable knowledge that silence is collaboration.

The others worry that my anger will compromise the work. Elena says wrath clouds judgment. Malik says history is not won by fury. Sofia says that if we become only reaction, then they still control the shape of us.

They are not wrong.

But they did not see what I saw in the lower archive after Event CL-44. They did not hear the recording before it corrected itself. They did not watch a man remember his own death and then forget why he was crying.

The government knows more than it admits. Worse, it knows what it can do with what it knows.`
    },
    {
      name: "06.12.2026",
      extension: "txt",
      data: `Records can be altered.
Memory can be pressured.
Fear can be manufactured.
A crisis can be staged, managed, named, and sold.

Freedom cannot survive if reality itself becomes an administrative decision.

This is why Operation Nemesis must continue.

Not as terrorism. Not as conquest. Not as some childish fantasy of burning the world clean.

Nemesis is resistance through evidence.

Every document copied.
Every name preserved.
Every hidden project exposed.
Every fabricated narrative broken open before it hardens into law.

They will call me unstable. They will call me dangerous. They will say I am a bitter old man chasing ghosts through classified corridors.

Let them.

A ghost can still haunt the guilty.

If this diary is found after I am taken, then understand this: I was not trying to become a hero. Heroes are useful to governments after they are dead. They carve them into statues and remove the inconvenient parts.

I am trying to remain a witness long enough to be believed.

My next attempt will not depend on permission from the press. I will prepare the files for release through independent channels. The first package must include Chronos Lattice, Janus Gate, Black Ice Bioreservoir, Aurora Veil, and HomeCommand Echo. The public must see that these are not isolated abuses. They are branches of the same buried tree.

I need proof that cannot be dismissed as rumor.
I need redundancy.
I need allies who understand that truth must be louder than fear.

Most of all, I need to remember why I began.

I began because no government owns the future.
I began because science without conscience becomes machinery for tyrants.
I began because the dead deserve witnesses, and the living deserve warning.
I began because the freedom of the world is not an abstract phrase. It is the right to know what is being done in our name, beneath our cities, above our skies, inside our homes, and behind the sealed doors where they decide which version of reality we are allowed to keep.

I failed once.

I will not stop.

If they close every newsroom, I will become the broadcast.
If they erase every record, I will become the archive.
If they make truth illegal, then I will become a criminal in service of it.

My name is Lucien Marek.

I have signed enough lies.

Now I will answer for them with truth.
`
    },
    {
      name: "06.14.2026",
      extension: "txt",
      data: `I told Sofia to remove certain parts of her bio at linkforge.com`
    },
    {
      name: "memories",
      extension: "txt",
      data: `https://drive.goagle.net/drive/folders/1QdK9vX2rL0nA4cF8pZsT6yE3hB7mNwR5t?usp=drive_link`
    }
  ];
  import_hackhub_content_sdk.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "DrayTek Vigor 2766ac",
    accessable: true,
    users: [
      import_hackhub_content_sdk.Network.createUser({
        username: "admin",
        password: "54nU65pPj0T93NEAbN09"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: firewallIp,
        type: import_hackhub_content_sdk.NetworkDeviceType.Firewall,
        name: "FIREWALL",
        users: [
          import_hackhub_content_sdk.Network.createUser({
            username: "admin",
            password: "re4we5pPj0T93NEAbfed23"
          })
        ],
        ports: [
          {
            external: 80,
            internal: 80,
            active: true,
            locked: true,
            service: "http"
          }
        ],
        rules: [
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: marekNodeIp
          },
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: bunkerIp
          },
          {
            allowed: false,
            port: 3306,
            source: "*",
            destination: bunkerIp
          }
        ]
      },
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: marekNodeIp,
            type: import_hackhub_content_sdk.NetworkDeviceType.Device,
            name: "MAREK",
            users: import_hackhub_content_sdk.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk.Network.createUser({
                  username: "marek",
                  password: "2sy9G4tndUADBx3kdPrs",
                  files: [
                    {
                      name: "documents",
                      isFolder: true,
                      children: marekDocuments
                    }
                  ]
                })
              ],
              { guest: true }
            ),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.6.5"
              }
            ]
          },
          {
            ip: bunkerIp,
            type: import_hackhub_content_sdk.NetworkDeviceType.Device,
            name: "BUNKER",
            users: import_hackhub_content_sdk.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk.Network.createUser({
                  username: "bunker",
                  password: "pokAWs7QycDdb0034AJL"
                })
              ],
              { guest: true }
            ),
            rootFiles: [
              {
                name: "bin",
                isFolder: true,
                children: [
                  {
                    name: "mari_init",
                    data: ""
                  },
                  {
                    name: "traceroute",
                    data: ""
                  }
                ]
              }
            ],
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.6.8"
              },
              {
                external: 3306,
                internal: 3306,
                active: false,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.8.1"
              }
            ]
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/SofiaKovalenkoNetwork.ts
var import_hackhub_content_sdk2 = require("@hotbunny/hackhub-content-sdk");

// src/networks/ChatlogFiles.ts
var NEMESIS_CHATLOGS = [
  "chatlog 01\n\nAdrian Kenji Mori: Channel opened. Do not use real project names, real site names, or personal devices. If your machine auto-syncs anything, disconnect now.\n\nTomasz Eliasz Wrobel: Relax, Adrian. This route is clean.\n\nAdrian Kenji Mori: That sentence has killed more operations than malware.\n\nLucien Marek: Everyone confirm presence. Short messages only.\n\nElena Maris Voss: Voss present.\n\nSofia Nadiya Kovalenko: Kovalenko present.\n\nMalik Jonathan Reyes: Reyes present. Metadata bundle is indexed.\n\nAmina Celine Okafor: Okafor present. I have reviewed the health tables.\n\nLucas Matteo Ferran: Ferran present. Facility diagrams are incomplete but usable.\n\nPriya Anjali Menon: Menon present. Satellite comparisons are ready.\n\nLucien Marek: Good. From this point forward, we are not activists, not martyrs, not heroes. We are custodians of proof.\n\nTomasz Eliasz Wrobel: Proof does not matter if it dies in a folder.\n\nLucien Marek: And leaks do not matter if nobody can verify them. We move carefully or we become noise.\n\nAdrian Kenji Mori: First rule: if you feel dramatic, do not type.\n\nSofia Nadiya Kovalenko: That eliminates Tomasz immediately.\n\nTomasz Eliasz Wrobel: Cruel, but efficient.",
  "chatlog 02\n\nSofia Nadiya Kovalenko: We captured twenty-seven pages. Eleven are clean. Six are readable with enhancement. Ten are partial.\n\nElena Maris Voss: The partials still show authorization stamps and instrument identifiers.\n\nLucien Marek: Any faces, badges, reflections?\n\nElena Maris Voss: No faces. One reflection in the glass cabinet, already cropped.\n\nAdrian Kenji Mori: Do not upload the originals to the shared relay. Strip device metadata first.\n\nSofia Nadiya Kovalenko: Already done. I know how a camera works, Adrian.\n\nAdrian Kenji Mori: I also know how arrests work.\n\nMalik Jonathan Reyes: The page numbers match the procurement index Tomasz pulled last month.\n\nTomasz Eliasz Wrobel: So the documents are real.\n\nMalik Jonathan Reyes: Real, yes. Complete, no.\n\nSofia Nadiya Kovalenko: One page mentions a containment event but the appendix is missing.\n\nLucas Matteo Ferran: If it is the appendix I think it is, they separated it for a reason.\n\nLucien Marek: Find the appendix. Until then, these photos stay internal.\n\nTomasz Eliasz Wrobel: People deserve to see them.\n\nLucien Marek: People deserve the truth, not fragments sharp enough to wound but too small to explain.",
  "chatlog 03\n\nAmina Celine Okafor: I finished reviewing the biological exposure tables. The public reports are not just incomplete. They are rearranged.\n\nLucien Marek: Rearranged how?\n\nAmina Celine Okafor: Subjects were grouped by outcome instead of exposure window. It makes the risk curve look harmless.\n\nMalik Jonathan Reyes: That would not be an accident. You do not misgroup time-series data by mistake at this level.\n\nElena Maris Voss: Could it be anonymization?\n\nAmina Celine Okafor: No. Anonymization removes identity. This removes causality.\n\nSofia Nadiya Kovalenko: Does it connect to the CERN detector anomalies?\n\nAmina Celine Okafor: Maybe. I need the missing appendix Lucas mentioned.\n\nLucas Matteo Ferran: The appendix likely contains incident duration, shielding status, and coolant-cycle failures.\n\nTomasz Eliasz Wrobel: Give me a filename pattern.\n\nAdrian Kenji Mori: No. Do not fish blindly through government servers again.\n\nTomasz Eliasz Wrobel: Blindly is such an ugly word.\n\nAdrian Kenji Mori: So is indictment.\n\nLucien Marek: Tomasz waits. Lucas narrows the search. Amina writes a plain-language summary with no speculation.\n\nAmina Celine Okafor: Understood. But Lucien, if this is what it looks like, people were used as margins in a report.",
  "chatlog 04\n\nPriya Anjali Menon: I compared the official site map with satellite captures from five dates. There is a structure missing from every public diagram.\n\nLucien Marek: Size?\n\nPriya Anjali Menon: Roughly sixty meters long. Subsurface entrance. Heat signature only appears during night-cycle operations.\n\nLucas Matteo Ferran: Could be a service corridor.\n\nPriya Anjali Menon: Service corridors do not get independent power feeds and restricted road access.\n\nMalik Jonathan Reyes: The transport invoices I mapped show deliveries to a nonexistent maintenance wing.\n\nElena Maris Voss: One of the photographed documents references Lower Annex C.\n\nSofia Nadiya Kovalenko: CERN public diagrams stop at Annex B.\n\nTomasz Eliasz Wrobel: Convenient alphabet.\n\nAdrian Kenji Mori: No jokes in operational notes.\n\nTomasz Eliasz Wrobel: Fine. Suspicious alphabet.\n\nLucien Marek: Priya, package the imagery as comparative frames only. No raw satellite source tags.\n\nPriya Anjali Menon: Already prepared. If anyone asks, the building does not officially exist.\n\nLucas Matteo Ferran: Then we should assume everything inside it was designed not to exist either.",
  "chatlog 05\n\nTomasz Eliasz Wrobel: I can push the first archive tonight.\n\nLucien Marek: No.\n\nTomasz Eliasz Wrobel: You answered too fast.\n\nLucien Marek: Because you keep asking the same dangerous question.\n\nSofia Nadiya Kovalenko: The photos prove document handling, not the full program.\n\nElena Maris Voss: And one image still needs authentication.\n\nTomasz Eliasz Wrobel: Authentication will not matter if they erase everything tomorrow.\n\nAdrian Kenji Mori: They will erase faster if you kick the door open with half a story.\n\nMalik Jonathan Reyes: The network graph is not complete. I still have three shell companies with no confirmed parent.\n\nPriya Anjali Menon: And the hidden annex imagery needs a second source.\n\nAmina Celine Okafor: If we leak the health data without context, they will call it misread science.\n\nTomasz Eliasz Wrobel: They will call it that anyway.\n\nLucien Marek: Then we make the denial harder than silence.\n\nTomasz Eliasz Wrobel: You are afraid.\n\nLucien Marek: Yes. That is why I am still useful.",
  "chatlog 06\n\nAdrian Kenji Mori: Emergency protocol. Stop using Relay Three.\n\nElena Maris Voss: Compromised?\n\nAdrian Kenji Mori: Observed. Not fully compromised yet.\n\nTomasz Eliasz Wrobel: Observed by who?\n\nAdrian Kenji Mori: Someone who knows our timing but not our names.\n\nLucien Marek: How close?\n\nAdrian Kenji Mori: Close enough to mirror our handshake window. Not close enough to decrypt payloads.\n\nMalik Jonathan Reyes: Could be automated traffic correlation.\n\nPriya Anjali Menon: Or someone inside one of the contractor networks.\n\nSofia Nadiya Kovalenko: Do we burn the route?\n\nAdrian Kenji Mori: Already burning. Move to Relay Seven after 02:00.\n\nTomasz Eliasz Wrobel: I have an upload scheduled through Three.\n\nAdrian Kenji Mori: Cancel it.\n\nTomasz Eliasz Wrobel: It is staged.\n\nAdrian Kenji Mori: Then unstage it before someone stages you in a courtroom.\n\nLucien Marek: Tomasz, cancel the upload. Adrian, send the new route. Nobody improvises tonight.",
  "chatlog 07\n\nLucas Matteo Ferran: I found the missing containment appendix.\n\nAmina Celine Okafor: Send the exposure tables first.\n\nLucas Matteo Ferran: You will not like them.\n\nAmina Celine Okafor: I rarely like evidence.\n\nLucas Matteo Ferran: The incident lasted forty-six minutes. Public summary says nine.\n\nSofia Nadiya Kovalenko: Forty-six is impossible unless the secondary loop failed.\n\nLucas Matteo Ferran: It did. Twice.\n\nElena Maris Voss: One of the photos shows a handwritten correction beside a cooling-cycle graph.\n\nLucas Matteo Ferran: That correction is the real duration.\n\nMalik Jonathan Reyes: Then the edited public record is provably false.\n\nAmina Celine Okafor: And the health model was built on the false duration.\n\nTomasz Eliasz Wrobel: Now we leak.\n\nLucien Marek: Now we verify chain of custody.\n\nTomasz Eliasz Wrobel: Lucien.\n\nLucien Marek: One forged link and they bury all of it. We do this properly.\n\nPriya Anjali Menon: I can confirm unusual heat discharge on the same night. It supports Lucas.\n\nAmina Celine Okafor: Then we finally have the bridge: facility failure, altered duration, altered health conclusions.",
  "chatlog 08\n\nTomasz Eliasz Wrobel: The release package is ready. Mirrors in six countries. Dead-man key armed.\n\nAdrian Kenji Mori: You armed a dead-man key without telling me?\n\nTomasz Eliasz Wrobel: If I told you, you would have told Lucien.\n\nLucien Marek: Correct.\n\nElena Maris Voss: What exactly is in the release?\n\nTomasz Eliasz Wrobel: Documents, photos, annex maps, contractor graph, health tables, internal summaries.\n\nSofia Nadiya Kovalenko: Raw photos?\n\nTomasz Eliasz Wrobel: Cropped and cleaned.\n\nSofia Nadiya Kovalenko: That was not the question.\n\nTomasz Eliasz Wrobel: No raw photos.\n\nAmina Celine Okafor: Are the subject identifiers removed from the health files?\n\nTomasz Eliasz Wrobel: Yes.\n\nMalik Jonathan Reyes: Are the model notes included?\n\nTomasz Eliasz Wrobel: Yes.\n\nPriya Anjali Menon: Did you include satellite source signatures?\n\nTomasz Eliasz Wrobel: No. Comparative frames only.\n\nLucas Matteo Ferran: Do not include the shutdown procedure.\n\nTomasz Eliasz Wrobel: I removed it.\n\nAdrian Kenji Mori: I want to inspect the package before release.\n\nTomasz Eliasz Wrobel: You have ten minutes.\n\nLucien Marek: He has as long as he needs.\n\nTomasz Eliasz Wrobel: The world has waited long enough.\n\nLucien Marek: The world can wait one more hour if that hour keeps innocent people alive.",
  "chatlog 09\n\nPriya Anjali Menon: The first mirror is live.\n\nMalik Jonathan Reyes: Second mirror indexed. Search engines are already caching excerpts.\n\nAdrian Kenji Mori: Traffic spike detected. Some of it is press. Some of it is not.\n\nAmina Celine Okafor: Journalists are asking about the health tables.\n\nSofia Nadiya Kovalenko: CERN contacts are denying Annex C exists.\n\nLucas Matteo Ferran: That denial will fail once Priya's frames circulate.\n\nElena Maris Voss: NASA contractors are calling the documents unauthenticated.\n\nMalik Jonathan Reyes: Expected. I attached the signature chain.\n\nTomasz Eliasz Wrobel: They are panicking.\n\nLucien Marek: Do not enjoy it.\n\nTomasz Eliasz Wrobel: I am allowed one minute.\n\nAdrian Kenji Mori: Your minute is over. Counter-trace attempts are increasing.\n\nPriya Anjali Menon: A major outlet just published the hidden-site comparison.\n\nAmina Celine Okafor: A medical ethics group is requesting the anonymized exposure model.\n\nSofia Nadiya Kovalenko: Someone from inside the facility just posted a confirmation.\n\nElena Maris Voss: Then it begins.\n\nLucas Matteo Ferran: No. It already happened. Now people can finally see it.\n\nTomasz Eliasz Wrobel: I told you the files had to breathe.\n\nLucien Marek: And I told you proof needed lungs before you threw it into the world.\n\nAdrian Kenji Mori: Everyone disconnect in order. No replies to journalists. No private explanations. No victory laps.\n\nMalik Jonathan Reyes: What happens now?\n\nLucien Marek: Now they try to bury us under doubt.\n\nAmina Celine Okafor: And if the public believes them?\n\nLucien Marek: Then we release the second vault."
];
var CIA_CHATLOGS = [
  "chatlog 01\n\nMara Ellison: Has anyone seen the morning brief packet? Mine still says pending review.\n\nAdrian Dane: Same here. Either the system is frozen again or someone upstairs discovered commas.\n\nNina Cross: Do not insult commas. They are holding this agency together.\n\nOwen Rusk: The packet is delayed because the regional summary had conflicting source notes.\n\nMara Ellison: Conflicting how?\n\nOwen Rusk: One field report says the meeting happened. Another says the principal never arrived. Third says the meeting happened without the principal.\n\nAdrian Dane: So a normal Tuesday.\n\nNina Cross: I checked the translation notes. The phrase they used could mean arrived, represented, or expected.\n\nMara Ellison: That is a delightful amount of ambiguity for 07:30.\n\nAdrian Dane: Intelligence work: where every sentence arrives wearing a fake mustache.\n\nOwen Rusk: We need to flag it as unresolved, not contradictory.\n\nNina Cross: Agreed. Contradictory makes it sound like someone lied. Unresolved means we need better context.\n\nMara Ellison: I will update the summary language.\n\nAdrian Dane: Please write it in English, not committee fog.\n\nMara Ellison: No promises. Committee fog has pension benefits.",
  "chatlog 02\n\nNina Cross: Who owns the final paragraph in the logistics assessment?\n\nAdrian Dane: If it is good, me. If it is bad, Owen.\n\nOwen Rusk: I have never trusted you less than I do in this moment.\n\nMara Ellison: The final paragraph needs to explain confidence level, not decorate the uncertainty.\n\nNina Cross: Thank you. Right now it says the movement pattern is notable but not decisive.\n\nAdrian Dane: That is accurate.\n\nNina Cross: It is also oatmeal wearing a badge.\n\nOwen Rusk: The pattern matters because it repeats after every procurement spike.\n\nMara Ellison: Then say that. The reader should not need a shovel to find the point.\n\nAdrian Dane: Fine. How about: recurring transport activity follows procurement spikes, suggesting preparation rather than routine maintenance.\n\nNina Cross: Better.\n\nOwen Rusk: Add medium confidence. We still lack direct confirmation.\n\nMara Ellison: Good. Send it before the deadline monster starts chewing on the calendar.\n\nAdrian Dane: Submitted.\n\nNina Cross: Look at us. Professionals for almost twelve consecutive seconds.",
  "chatlog 03\n\nAdrian Dane: The third-floor printer has jammed again.\n\nMara Ellison: That printer has been hostile since the Clinton administration.\n\nOwen Rusk: It printed one page of my report, then thirty-seven pages of diagonal lines.\n\nNina Cross: That means it has achieved agency-grade redaction.\n\nAdrian Dane: I am naming it Director Paperjam.\n\nMara Ellison: Respect the chain of command. That printer outranks us.\n\nOwen Rusk: The coffee machine is also broken.\n\nNina Cross: Impossible. I used it five minutes ago.\n\nOwen Rusk: Then you drank whatever came out of it?\n\nNina Cross: I survived.\n\nAdrian Dane: Survival is not endorsement.\n\nMara Ellison: We handle crises around the world but cannot maintain hot water and toner.\n\nOwen Rusk: That is because hostile actors are easier to understand than office equipment.\n\nNina Cross: I am submitting a facilities ticket.\n\nAdrian Dane: Mark it urgent.\n\nMara Ellison: Mark it existential.\n\nOwen Rusk: Mark it classified. Maybe then someone will read it."
];
function pickChatlog(logs) {
  return logs[Math.floor(Math.random() * logs.length)] ?? logs[0] ?? "";
}
function createHomeUserDocumentsChatlog(data) {
  return [
    {
      name: "home",
      isFolder: true,
      children: [
        {
          name: "user",
          isFolder: true,
          children: [
            {
              name: "documents",
              isFolder: true,
              children: [
                {
                  name: "chatlog",
                  extension: "txt",
                  data,
                  readonly: true
                }
              ]
            }
          ]
        }
      ]
    }
  ];
}
function createNemesisChatlogRootFiles() {
  return createHomeUserDocumentsChatlog(pickChatlog(NEMESIS_CHATLOGS));
}
function createCIAChatlogRootFiles() {
  return createHomeUserDocumentsChatlog(pickChatlog(CIA_CHATLOGS));
}

// src/networks/SofiaKovalenkoNetwork.ts
function createSofiaKovalenkoNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk2.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk2.Network.randomIp(),
    blackIrisIp: import_hackhub_content_sdk2.Network.randomIp(),
    silentOracleIp: import_hackhub_content_sdk2.Network.randomIp(),
    mirrorNodeIp: import_hackhub_content_sdk2.Network.randomIp(),
    vaultWitnessIp: import_hackhub_content_sdk2.Network.randomIp()
  };
}
function createSofiaKovalenkoNetwork(ips = createSofiaKovalenkoNetworkIps()) {
  const {
    routerIp,
    splitterIp,
    blackIrisIp,
    silentOracleIp,
    mirrorNodeIp,
    vaultWitnessIp
  } = ips;
  import_hackhub_content_sdk2.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk2.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "MikroTik hAP ax2",
    accessable: true,
    users: [
      import_hackhub_content_sdk2.Network.createUser({
        username: "admin",
        password: "TRf95Zkk9avi3UkiM9Fc"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk2.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: blackIrisIp,
            type: import_hackhub_content_sdk2.NetworkDeviceType.Device,
            name: "Black-Iris",
            users: import_hackhub_content_sdk2.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk2.Network.createUser({
                  username: "sof789",
                  password: "J6w1nFP93DQLNhHHTrXt"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.6.7"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.8.2"
              }
            ]
          },
          {
            ip: silentOracleIp,
            type: import_hackhub_content_sdk2.NetworkDeviceType.Device,
            name: "Silent-Oracle",
            users: import_hackhub_content_sdk2.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk2.Network.createUser({
                  username: "ssadmin",
                  password: "7aG5u01cxQiCF6fzbq0Y"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.1"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.8.4"
              }
            ]
          },
          {
            ip: mirrorNodeIp,
            type: import_hackhub_content_sdk2.NetworkDeviceType.Device,
            name: "Mirror-Node",
            users: import_hackhub_content_sdk2.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk2.Network.createUser({
                  username: "admin",
                  password: "W1q7svE9K8iaweQbijgg"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.6.9"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.1"
              }
            ]
          },
          {
            ip: vaultWitnessIp,
            type: import_hackhub_content_sdk2.NetworkDeviceType.Device,
            name: "Vault-Witness",
            users: import_hackhub_content_sdk2.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk2.Network.createUser({
                  username: "alpino",
                  password: "RVD38DeJHuNK9BCf8VVt"
                })
              ],
              { guest: true }
            ),
            rootFiles: [
              {
                name: "documents",
                isFolder: true,
                children: [
                  {
                    name: "Home",
                    extension: "txt",
                    data: `The door is not hidden by stone,
but by belonging.

It opens only for names
already written in the dark.

Those outside call it empty.
Those inside call it home.
aHR0cHM6Ly92YXVsdC5vcmcvbWVtYmVyc19ob21l`
                  }
                ]
              },
              {
                name: "logs",
                isFolder: true,
                children: [
                  {
                    name: "chatlog",
                    extension: "txt",
                    data: `Lucien Marek: glass cascade is already moving. 
              They buried the Zurich relay chatter under three public crises before sunrise.

Sofia Kovalenko: Then swan has coordination authority. They are not reacting anymore, 
                 Lucien. They are pruning timelines.

Lucien Marek: I know. Echo flagged two safe flats through emergency certificate traffic. 
              We burned both routes.

Sofia Kovalenko: meridian gave us the better path anyway. 
                 The antarctic archive mirror is still outside their domestic sensor net.

Lucien Marek: For now. Veil is being used to soften the public field before the first denial package drops.

Sofia Kovalenko: Which means they expect the archive to surface.
                 Good. Fear makes them procedural.

Lucien Marek: Janus gave us one clean transmission window. 
              Seventeen seconds, maybe less if they are watching the mirrors.

Sofia Kovalenko: Then we don\u2019t send everything. 
                 We send the index, the swan authorization note, and the names.

Lucien Marek: And chronos?

Sofia Kovalenko: Leave that buried until they lie about the timestamp. 
                 Then we let time correct them.`
                  }
                ]
              }
            ],
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.6.8"
              }
            ]
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/ElenaMarisVossNetwork.ts
var import_hackhub_content_sdk3 = require("@hotbunny/hackhub-content-sdk");
function createElenaMarisVossNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk3.Network.randomIp(),
    firewallIp: import_hackhub_content_sdk3.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk3.Network.randomIp(),
    nightIndexIp: import_hackhub_content_sdk3.Network.randomIp(),
    echoCasketIp: import_hackhub_content_sdk3.Network.randomIp(),
    glassSentinelIp: import_hackhub_content_sdk3.Network.randomIp(),
    seaBridgeIp: import_hackhub_content_sdk3.Network.randomIp()
  };
}
function createElenaMarisVossNetwork(ips = createElenaMarisVossNetworkIps()) {
  const {
    routerIp,
    firewallIp,
    splitterIp,
    nightIndexIp,
    echoCasketIp,
    glassSentinelIp,
    seaBridgeIp
  } = ips;
  import_hackhub_content_sdk3.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk3.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "Netgear Nighthawk R6700",
    accessable: true,
    users: [
      import_hackhub_content_sdk3.Network.createUser({
        username: "admin",
        password: "bmQuIE5vIG9uZSBj"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: firewallIp,
        type: import_hackhub_content_sdk3.NetworkDeviceType.Firewall,
        name: "FIREWALL",
        users: [
          import_hackhub_content_sdk3.Network.createUser({
            username: "admin",
            password: "QuIE5vIG9uZSB"
          })
        ],
        ports: [
          {
            external: 80,
            internal: 80,
            active: true,
            locked: true,
            service: "http"
          }
        ],
        rules: [
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: seaBridgeIp
          }
        ]
      },
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk3.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: nightIndexIp,
            type: import_hackhub_content_sdk3.NetworkDeviceType.Device,
            name: "Night-Index",
            users: import_hackhub_content_sdk3.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk3.Network.createUser({
                  username: "ngma",
                  password: "SBzZWNyZXQsIHll"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.2"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.2"
              }
            ]
          },
          {
            ip: echoCasketIp,
            type: import_hackhub_content_sdk3.NetworkDeviceType.Device,
            name: "Echo-Casket",
            users: import_hackhub_content_sdk3.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk3.Network.createUser({
                  username: "rench",
                  password: "mQgSSBhbSBsZW"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.3"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.3"
              }
            ]
          },
          {
            ip: glassSentinelIp,
            type: import_hackhub_content_sdk3.NetworkDeviceType.Device,
            name: "Glass-Sentinel",
            users: import_hackhub_content_sdk3.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk3.Network.createUser({
                  username: "admin",
                  password: "kstODI1Ri1N"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.4"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.4"
              }
            ]
          },
          {
            ip: seaBridgeIp,
            type: import_hackhub_content_sdk3.NetworkDeviceType.Device,
            name: "Sea-Bridge",
            users: import_hackhub_content_sdk3.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk3.Network.createUser({
                  username: "bridgit",
                  password: "ZWFrIHdpdGhvdXQ"
                })
              ],
              { guest: true }
            ),
            rootFiles: [
              {
                name: "documents",
                isFolder: true,
                children: [
                  {
                    name: "Mark",
                    extension: "txt",
                    data: "SSB0b3VjaCBldmVyeSBzZWNyZXQsIHlldCBJIHNwZWFrIHdpdGhvdXQgc291bmQuIE5vIG9uZSBjYW4gY29weSBteSBwYXR0ZXJuLCBhbmQgSSBhbSBsZWZ0IHdoZXJldmVyIEkgYW0gZm91bmQuICNNUkstODI1Ri1NQVJJ"
                  }
                ]
              },
              {
                name: "logs",
                isFolder: true,
                children: [
                  {
                    name: "chatlog",
                    extension: "txt",
                    data: `Elena Voss: Malik, janus aperture is repeating the same directory path every seventeen seconds.

Malik Reyes: Then it is not a leak. It is either an invitation or bait.

Elena Voss: The file tree references chronos timestamps that should not exist until next week.

Malik Reyes: Swan will call that contamination and use it to bury the archive.

Elena Voss: Then we split the index now. You move nemesis. I\u2019ll keep janus ticking.

Elena Voss: By the way, i have stored an encrypted text in my gateway about the fingerprint on ark
so that i dont forget it, you can do the same if you need to

Malik Reyes: Oh ok, i might do that`
                  }
                ]
              }
            ],
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.5"
              }
            ]
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/AdrianKenjiMoriNetwork.ts
var import_hackhub_content_sdk4 = require("@hotbunny/hackhub-content-sdk");
function createAdrianKenjiMoriNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk4.Network.randomIp(),
    firewallIp: import_hackhub_content_sdk4.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk4.Network.randomIp(),
    janRelayIp: import_hackhub_content_sdk4.Network.randomIp(),
    meridianGhostIp: import_hackhub_content_sdk4.Network.randomIp(),
    deadletterIp: import_hackhub_content_sdk4.Network.randomIp(),
    oceanBridgeIp: import_hackhub_content_sdk4.Network.randomIp()
  };
}
function createAdrianKenjiMoriNetwork(ips = createAdrianKenjiMoriNetworkIps()) {
  const {
    routerIp,
    firewallIp,
    splitterIp,
    janRelayIp,
    meridianGhostIp,
    deadletterIp,
    oceanBridgeIp
  } = ips;
  import_hackhub_content_sdk4.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk4.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "ASUS RT-AX58U",
    accessable: true,
    users: [
      import_hackhub_content_sdk4.Network.createUser({
        username: "admin",
        password: "dt4gC82nYGBrLPEfEaeM"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: firewallIp,
        type: import_hackhub_content_sdk4.NetworkDeviceType.Firewall,
        name: "FIREWALL",
        users: [
          import_hackhub_content_sdk4.Network.createUser({
            username: "ftom",
            password: "AAZ0DnVfsYTdb6g3gbQE"
          })
        ],
        ports: [
          {
            external: 80,
            internal: 80,
            active: true,
            locked: true,
            service: "http"
          }
        ],
        rules: [
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: oceanBridgeIp
          }
        ]
      },
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk4.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: janRelayIp,
            type: import_hackhub_content_sdk4.NetworkDeviceType.Device,
            name: "Jan-Relay",
            users: import_hackhub_content_sdk4.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk4.Network.createUser({
                  username: "tomjex",
                  password: "dumjYgiTWaWt86ocMEYM"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.6"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.5"
              }
            ]
          },
          {
            ip: meridianGhostIp,
            type: import_hackhub_content_sdk4.NetworkDeviceType.Device,
            name: "Meridian-Ghost",
            users: import_hackhub_content_sdk4.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk4.Network.createUser({
                  username: "yugin",
                  password: "yo5PmYttp1xGy95Y7XEL"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.7"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.6"
              }
            ]
          },
          {
            ip: deadletterIp,
            type: import_hackhub_content_sdk4.NetworkDeviceType.Device,
            name: "Deadletter",
            users: import_hackhub_content_sdk4.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk4.Network.createUser({
                  username: "admin",
                  password: "pkgC2Rs5dmMAokJaVRwn"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.8"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 3.9.7"
              }
            ]
          },
          {
            ip: oceanBridgeIp,
            type: import_hackhub_content_sdk4.NetworkDeviceType.Device,
            name: "Ocean-Bridge",
            users: import_hackhub_content_sdk4.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk4.Network.createUser({
                  username: "adriano",
                  password: "m90IGdvbmUuIFB"
                })
              ],
              { guest: true }
            ),
            rootFiles: [
              {
                name: "documents",
                isFolder: true,
                children: [
                  {
                    name: "Level",
                    extension: "txt",
                    data: "SSBoaWRlIGJlbmVhdGggYW5vdGhlciB0aGluZywgYnV0IEkgYW0gbm90IGdvbmUuIFBlZWwgb25lIGF3YXksIGFuZCB5b3Ugd2lsbCBmaW5kIG1lLiAjOQ=="
                  }
                ]
              },
              {
                name: "logs",
                isFolder: true,
                children: [
                  {
                    name: "chatlog",
                    extension: "txt",
                    data: `Adrian Mori: the echo bridge is chaining vendor certificates through an inactive emergency root.

Tomasz Wrobel: That should be impossible unless the relay is still trusted by the device firmware.

Adrian Mori: it is. Speakers, routers, cameras, thermostats, and car telemetry are resolving as one sensor mesh.

Tomasz Wrobel: Can you isolate the root without triggering a compliance reset?

Adrian Mori: Not cleanly. A reset would flag every connected home as an anomaly.

Tomasz Wrobel: then spoof the relay health check. Let the mesh believe the root is alive, but feed it dead telemetry.`
                  }
                ]
              }
            ],
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.7.9"
              }
            ]
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/TomaszEliaszWrobelNetwork.ts
var import_hackhub_content_sdk5 = require("@hotbunny/hackhub-content-sdk");
function createTomaszEliaszWrobelNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk5.Network.randomIp(),
    firewallIp: import_hackhub_content_sdk5.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk5.Network.randomIp(),
    zeroBridgeIp: import_hackhub_content_sdk5.Network.randomIp(),
    moriCacheIp: import_hackhub_content_sdk5.Network.randomIp(),
    falseSunIp: import_hackhub_content_sdk5.Network.randomIp(),
    orphanRelayIp: import_hackhub_content_sdk5.Network.randomIp(),
    deepBridgeIp: import_hackhub_content_sdk5.Network.randomIp()
  };
}
function createTomaszEliaszWrobelNetwork(ips = createTomaszEliaszWrobelNetworkIps()) {
  const {
    routerIp,
    firewallIp,
    splitterIp,
    zeroBridgeIp,
    moriCacheIp,
    falseSunIp,
    orphanRelayIp,
    deepBridgeIp
  } = ips;
  import_hackhub_content_sdk5.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk5.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "Ubiquiti EdgeRouter X",
    accessable: true,
    users: [
      import_hackhub_content_sdk5.Network.createUser({
        username: "admin",
        password: "kQbrX4vPVYLzp82kstgv"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: firewallIp,
        type: import_hackhub_content_sdk5.NetworkDeviceType.Firewall,
        name: "FIREWALL",
        users: [
          import_hackhub_content_sdk5.Network.createUser({
            username: "admin",
            password: "skHGcDxt64yNQr12ELjP"
          })
        ],
        ports: [
          {
            external: 80,
            internal: 80,
            active: true,
            locked: true,
            service: "http"
          }
        ],
        rules: [
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: deepBridgeIp
          }
        ]
      },
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk5.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: zeroBridgeIp,
            type: import_hackhub_content_sdk5.NetworkDeviceType.Device,
            name: "Zero-Bridge",
            users: import_hackhub_content_sdk5.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk5.Network.createUser({
                  username: "zerotj",
                  password: "tt97BBQ3ekdVJw6dVDCN"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.8.1"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.0.1"
              }
            ]
          },
          {
            ip: moriCacheIp,
            type: import_hackhub_content_sdk5.NetworkDeviceType.Device,
            name: "Mori Cache",
            users: import_hackhub_content_sdk5.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk5.Network.createUser({
                  username: "nemnem2",
                  password: "VDLLCZK9RUZ6TvJQKH4J"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.8.2"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.0.2"
              }
            ]
          },
          {
            ip: falseSunIp,
            type: import_hackhub_content_sdk5.NetworkDeviceType.Device,
            name: "False-Sun",
            users: import_hackhub_content_sdk5.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk5.Network.createUser({
                  username: "admin",
                  password: "MCRhTB1yRJnjc1R9CaTA"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.8.3"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.0.3"
              }
            ]
          },
          {
            ip: orphanRelayIp,
            type: import_hackhub_content_sdk5.NetworkDeviceType.Device,
            name: "Orphan-Relay",
            users: import_hackhub_content_sdk5.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk5.Network.createUser({
                  username: "admin",
                  password: "RpxfVu1fKJAzQsAhsGfv"
                })
              ],
              { guest: true }
            ),
            rootFiles: createNemesisChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.8.4"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.0.4"
              }
            ]
          },
          {
            ip: deepBridgeIp,
            type: import_hackhub_content_sdk5.NetworkDeviceType.Device,
            name: "Deep-Bridge",
            users: import_hackhub_content_sdk5.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk5.Network.createUser({
                  username: "printf",
                  password: "bGH0gBp3N5KU15Pa6bGC",
                  firstName: "Tomasz",
                  lastName: "Wrobel",
                  online: true,
                  email: {
                    address: "tomasz.wrobel@gomail.com",
                    password: "bGH0gBp3N5KU15Pa6bGC"
                  }
                })
              ],
              { guest: true }
            ),
            rootFiles: [
              {
                name: "documents",
                isFolder: true,
                children: [
                  {
                    name: "Token",
                    extension: "txt",
                    data: "SSBzbGVlcCBpbiB0aGUgZ3JvdW5kLCBzbWFsbCBhbmQgaGlkZGVuIGZyb20gc2lnaHQuIEdpdmUgbWUgd2F0ZXIgYW5kIHRpbWUsIGFuZCBJIGdyb3cgdG93YXJkIHRoZSBsaWdodC4gIzg1RjlD"
                  }
                ]
              },
              {
                name: "config",
                isFolder: true,
                children: [
                  {
                    name: "contacts",
                    extension: "txt",
                    data: "recovery_contact=tomasz.wrobel@gomail.com"
                  }
                ]
              },
              {
                name: "logs",
                isFolder: true,
                children: [
                  {
                    name: "chatlog",
                    extension: "txt",
                    data: `Tomasz Wrobel: Priya, the glass model is still pulling live crisis weights from the old emergency channel.

Priya Menon: That channel was supposed to be severed after Brussels.

Tomasz Wrobel: It was severed on paper. The media-effects lab kept a passive mirror for \u201Ccontinuity testing.\u201D

Priya Menon: what's the overlap index?

Tomasz Wrobel: War panic, market instability, health alert, and a political scandal. Four layers. One buried disclosure.

Priya Menon: Then the system is not detecting chaos anymore. It is composing it.

========================================================================================================================================================================================================================`
                  },
                  {
                    name: "chatlog1",
                    extension: "txt",
                    data: `Tomasz Wrobel: marek, i need access to the data, i have to update some final details.

Marek Lucien: The Ark application looks like it's having some server issues lately. Here you go, marekrev:IWRvbWo2MzQkZm9kKnhjOTA=

Tomasz Wrobel: thanks marek

Marek Lucien: Thank me when all this thing get to it's pre-configured point, see you at Ark tom.

--`
                  }
                ]
              }
            ],
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.8.5"
              }
            ]
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/VaultNetwork.ts
var import_hackhub_content_sdk6 = require("@hotbunny/hackhub-content-sdk");
function createVaultNetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk6.Network.randomIp(),
    vaultIp: import_hackhub_content_sdk6.Network.randomIp()
  };
}
function createVaultNetwork(ips = createVaultNetworkIps()) {
  const { routerIp, vaultIp } = ips;
  import_hackhub_content_sdk6.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk6.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "Zyxel VMG3925-B10C",
    accessable: true,
    domain: { name: "vault.org" },
    users: [
      import_hackhub_content_sdk6.Network.createUser({
        username: "admin",
        password: "vv97BBQ3tydVJw6dVFCo"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: vaultIp,
        type: import_hackhub_content_sdk6.NetworkDeviceType.Device,
        name: "VAULT",
        users: import_hackhub_content_sdk6.Network.createDefaultUserSchema(
          [
            import_hackhub_content_sdk6.Network.createUser({
              username: "admin",
              password: "m19U7gjoaiMF2yV9CPfz"
            })
          ],
          { guest: true }
        ),
        rootFiles: [
          {
            name: "documents",
            isFolder: true,
            children: [
              {
                name: "Account_vault_asset",
                extension: "txt",
                data: "user10:JHByb2ohcmV2Kg=="
              }
            ]
          }
        ],
        ports: [
          {
            external: 22,
            internal: 22,
            active: false,
            locked: false,
            service: "ssh",
            version: "OpenSSH 1.6.8"
          }
        ]
      }
    ]
  });
  return ips;
}

// src/networks/CIANetwork.ts
var import_hackhub_content_sdk7 = require("@hotbunny/hackhub-content-sdk");
function createCIANetworkIps() {
  return {
    routerIp: import_hackhub_content_sdk7.Network.randomIp(),
    firewallIp: import_hackhub_content_sdk7.Network.randomIp(),
    splitterIp: import_hackhub_content_sdk7.Network.randomIp(),
    langleyGatewayIp: import_hackhub_content_sdk7.Network.randomIp(),
    oracleGatewayIp: import_hackhub_content_sdk7.Network.randomIp(),
    webServerIp: import_hackhub_content_sdk7.Network.randomIp(),
    operationsIp: import_hackhub_content_sdk7.Network.randomIp(),
    internalArchiveIp: import_hackhub_content_sdk7.Network.randomIp(),
    recordsGatewayIp: import_hackhub_content_sdk7.Network.randomIp()
  };
}
var visualArchiveFiles = [
  { name: "operation07", extension: "dat" },
  { name: "project_janus", extension: "bin" },
  { name: "blue_window", extension: "idx" },
  { name: "silent_court", extension: "arc" },
  { name: "asset_mirror", extension: "tmp" },
  { name: "case_lattice", extension: "blob" },
  { name: "clearance_delta", extension: "pkg" },
  { name: "echo_vault", extension: "bin" },
  { name: "field_note_34", extension: "dat" },
  { name: "index_blackout", extension: "idx" },
  { name: "ledger_shadow", extension: "arc" },
  { name: "node_witness", extension: "tmp" },
  { name: "LucienMarekFiles", extension: "bundle" },
  { name: "Nemesis_Data", extension: "enc" },
  { name: "redaction_queue", extension: "pkg" }
].map((file) => ({
  ...file,
  data: "",
  readonly: true
}));
function createCIANetwork(ips = createCIANetworkIps()) {
  const {
    routerIp,
    firewallIp,
    splitterIp,
    langleyGatewayIp,
    oracleGatewayIp,
    webServerIp,
    operationsIp,
    internalArchiveIp,
    recordsGatewayIp
  } = ips;
  import_hackhub_content_sdk7.Network.createSubnetNetwork({
    ip: routerIp,
    type: import_hackhub_content_sdk7.NetworkDeviceType.Router,
    name: "ROUTER",
    model: "Cisco RV340",
    accessable: true,
    users: [
      import_hackhub_content_sdk7.Network.createUser({
        username: "admin",
        password: "fe0gwdm9ob3YxMrf"
      })
    ],
    ports: [
      {
        external: 80,
        internal: 80,
        active: true,
        locked: true,
        service: "http"
      }
    ],
    children: [
      {
        ip: firewallIp,
        type: import_hackhub_content_sdk7.NetworkDeviceType.Firewall,
        name: "FIREWALL",
        users: [
          import_hackhub_content_sdk7.Network.createUser({
            username: "admin",
            password: "0gwdm9ob3YxM"
          })
        ],
        ports: [
          {
            external: 80,
            internal: 80,
            active: true,
            locked: true,
            service: "http"
          }
        ],
        rules: [
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: operationsIp
          },
          {
            allowed: false,
            port: 22,
            source: "*",
            destination: internalArchiveIp
          },
          {
            allowed: false,
            port: 3306,
            source: "*",
            destination: internalArchiveIp
          }
        ]
      },
      {
        ip: splitterIp,
        type: import_hackhub_content_sdk7.NetworkDeviceType.Splitter,
        name: "Internal LAN",
        users: [],
        children: [
          {
            ip: langleyGatewayIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "LANGLEY-GATEWAY",
            users: import_hackhub_content_sdk7.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk7.Network.createUser({
                  username: "admin",
                  password: "ZCBJIGdyb3cgdG9"
                })
              ],
              { guest: true }
            ),
            rootFiles: createCIAChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.9.1"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.1.1"
              }
            ]
          },
          {
            ip: oracleGatewayIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "ORACLE_GATEWAY",
            users: import_hackhub_content_sdk7.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk7.Network.createUser({
                  username: "admin",
                  password: "0gc2lnaHQuIEdpdmU"
                })
              ],
              { guest: true }
            ),
            rootFiles: createCIAChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: true,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.9.2"
              },
              {
                external: 3306,
                internal: 3306,
                active: true,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.1.2"
              }
            ]
          },
          {
            ip: webServerIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "WEB-SERVER",
            domain: { name: "agency-records.archive.net" },
            users: import_hackhub_content_sdk7.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk7.Network.createUser({
                  username: "webadmin",
                  password: "nn84K0v3cTQm9xA1"
                })
              ],
              { guest: true }
            ),
            rootFiles: createCIAChatlogRootFiles(),
            ports: [
              {
                external: 80,
                internal: 80,
                active: true,
                locked: true,
                service: "http",
                version: "Apache 2.4.13"
              }
            ]
          },
          {
            ip: operationsIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "OPERATIONS",
            users: import_hackhub_content_sdk7.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk7.Network.createUser({
                  username: "admin",
                  password: "pdmUgbWUgd2F0ZX"
                })
              ],
              { guest: true }
            ),
            rootFiles: createCIAChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.9.3"
              }
            ]
          },
          {
            ip: internalArchiveIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "INTERNAL-ARCHIVE",
            users: import_hackhub_content_sdk7.Network.createDefaultUserSchema(
              [
                import_hackhub_content_sdk7.Network.createUser({
                  username: "admin",
                  password: "G1wxx7Cd9hKQm4Zs"
                })
              ],
              { guest: true }
            ),
            rootFiles: createCIAChatlogRootFiles(),
            ports: [
              {
                external: 22,
                internal: 22,
                active: false,
                locked: false,
                service: "ssh",
                version: "OpenSSH 1.9.4"
              },
              {
                external: 3306,
                internal: 3306,
                active: false,
                locked: false,
                service: "mysql",
                version: "MariaDB 4.1.3"
              }
            ]
          },
          {
            ip: recordsGatewayIp,
            type: import_hackhub_content_sdk7.NetworkDeviceType.Device,
            name: "RECORDS-GATEWAY",
            users: [
              { username: "root" },
              { username: "guest" },
              {
                username: "adrian",
                password: "aza0gwdm9ob3YxMxz",
                firstName: "Adrian",
                lastName: "Dane",
                online: true,
                acceptReverseTCP: true,
                email: {
                  address: "adrian.dane@gomail.com",
                  password: "aza0gwdm9ob3YxMxz"
                }
              }
            ],
            rootFiles: [
              ...createCIAChatlogRootFiles(),
              {
                name: "documents",
                isFolder: true,
                children: visualArchiveFiles
              }
            ],
            ports: []
          }
        ]
      }
    ]
  });
  return ips;
}

// src/traceroute/LinkForgeTraceRegistry.ts
var import_hackhub_content_sdk8 = require("@hotbunny/hackhub-content-sdk");
var TRACE_ID = "TRACE-ID v1.8.4";
var TRACE_RECORD_TYPE = "PERSONNEL_NODE";
var TRACEROUTE_RECORDS_STORAGE_KEY = "traceroute.personnel-router-addresses.v1";
var LINKFORGE_PROFILE_FULL_NAMES = [
  "Lucien Marek",
  "Elena Maris Voss",
  "Malik Jonathan Reyes",
  "Sofia Nadiya Kovalenko",
  "Adrian Kenji Mori",
  "Amina Celine Okafor",
  "Lucas Matteo Ferran",
  "Priya Anjali Menon",
  "Tomasz Eliasz Wrobel"
];
function normalizeIdentityName(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function getCanonicalLinkForgeProfileFullName(value) {
  const normalized = normalizeIdentityName(value);
  return LINKFORGE_PROFILE_FULL_NAMES.find((name) => normalizeIdentityName(name) === normalized);
}
function getTracerouteRouterAddressRecords() {
  return import_hackhub_content_sdk8.SaveStorage.get(TRACEROUTE_RECORDS_STORAGE_KEY) ?? {};
}
function setTracerouteRouterAddressRecords(records) {
  import_hackhub_content_sdk8.SaveStorage.set(TRACEROUTE_RECORDS_STORAGE_KEY, {
    ...getTracerouteRouterAddressRecords(),
    ...records
  });
}

// src/mail/NemesisMailTemplates.ts
var import_hackhub_content_sdk9 = require("@hotbunny/hackhub-content-sdk");
var TOMASZ_WROBEL_EMAIL = "tomasz.wrobel@gomail.com";
var RECOVERED_DATA_TEMPLATE_ID = "nemesis-recovered-data-location";
var LEGACY_RECOVERED_DATA_TEMPLATE_IDS = [
  "nemesis-recovered-data",
  "nemesis-recovered-data-location",
  "cia-authorization",
  "cia-event-ticket",
  "nemesis-cia-authorization"
];
var RECOVERED_DATA_EVENT = "Recovered Data";
var RECOVERED_DATA_SUBJECT = "Nemesis Data location";
var NEMESIS_DATA_VALUE = "Nemesis_Data.enc";
var NEMESIS_DATA_NODE_VALUE = "RECORDS-GATEWAY";
var RECOVERED_DATA_TEMPLATE_CONTENT = "I have found the lost {{DATA}} into the agency's network at {{NODE}} device under documents directory.";
var TOMASZ_RECOVERED_DATA_REPLY = `Hey,

I am not even going to ask how you got that info. I can handle the rest from here. 

I have spent the last twenty minutes staring at the transfer log, and every explanation I can think of makes my headache worse.

The package is already moving through the channels we prepared. If even half of them hold, this will be on every major feed before they understand what slipped through. 

For the first time in a long while, we may actually get to breathe. 

A small breath, sure. Nothing dramatic. No victory music. Maybe one chair collapsing under someone from pure relief.

But still. A breath.

Thank you. I mean that. What you did matters more than you probably realize.

There is something else you should know, if you have not figured it out already.

Marek did not make it.

He bought us the time to finish this. Protected the team, protected the archive and the purpose of all of it. He put the mission ahead of his own life, because of course he did. Stubborn old bastard always did have a talent for making heroism look inconvenient.

The rest of us may not be far behind him. That is not self-pity. It is just arithmetic.

Before that happens, there is one link worth looking at, assuming you still have the nerves left to spend:

https://nemesis.net

Be careful. And if you find anything ugly in there, try not to act surprised.

We are well past ugly now.`;
function registerNemesisMailTemplates() {
  for (const templateId of LEGACY_RECOVERED_DATA_TEMPLATE_IDS) {
    try {
      import_hackhub_content_sdk9.Mail.unregisterTemplate(templateId);
    } catch {
    }
  }
  import_hackhub_content_sdk9.Mail.registerTemplate({
    id: RECOVERED_DATA_TEMPLATE_ID,
    label: RECOVERED_DATA_EVENT,
    title: RECOVERED_DATA_SUBJECT,
    content: RECOVERED_DATA_TEMPLATE_CONTENT,
    fields: ["DATA", "NODE"]
  });
}
function unregisterNemesisMailTemplates() {
  for (const templateId of LEGACY_RECOVERED_DATA_TEMPLATE_IDS) {
    try {
      import_hackhub_content_sdk9.Mail.unregisterTemplate(templateId);
    } catch {
    }
  }
}

// src/quests/NemesisProtocolStage1Quest.ts
var NEMESIS_AVATAR = "assets/nemesis-feed-profile-logo.png";
var MAREK_SENDER = "Lucien Marek <lmarek@protonvault.ch>";
function createIntroductionMail(routerIp) {
  return `You do not know me.

I know enough about you.
For several years, I followed the public remains of your work. Systems repaired after you exposed them. Companies embarrassed into protecting their customers. People who hated you publicly and quietly corrected everything you found.
You enter places without destroying them. That matters.

I spent most of my life protecting information that should never have existed. At first, I believed silence protected the public. Later, I understood that silence protected only the people responsible.

I cannot send you the archive directly.
A document can be intercepted. A person can be persuaded. A locked machine requires commitment.

The address below belongs to me.

${routerIp}

Do not reply to this account. It is not monitored.

One final warning:
Do not decide what you believe until you have seen all of it.

L. Marek`;
}
function readRecoveredDataFields(content) {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}
function persistTracerouteRouterAddressRecords(records) {
  try {
    setTracerouteRouterAddressRecords(records);
  } catch {
  }
}
function createAllNetworkData() {
  return {
    marekNetwork: createMarekNetworkIps(),
    sofiaKovalenkoNetwork: createSofiaKovalenkoNetworkIps(),
    elenaMarisVossNetwork: createElenaMarisVossNetworkIps(),
    adrianKenjiMoriNetwork: createAdrianKenjiMoriNetworkIps(),
    tomaszEliaszWrobelNetwork: createTomaszEliaszWrobelNetworkIps(),
    vaultNetwork: createVaultNetworkIps(),
    ciaNetwork: createCIANetworkIps()
  };
}
var NemesisProtocolStage1Quest = class extends import_hackhub_content_sdk10.Quest {
  constructor() {
    super(...arguments);
    this.Name = "NemesisProtocolStage1";
    this.Title = "Nemesis Protocol";
    this.Description = "A private posting leads to a contact named Lucien Marek.";
    this.Icon = "assets/nemesis-mod-logo.png";
    this.Group = "storyline";
    this.AutoStart = false;
    this.AutoComplete = false;
    this.HasCompleteButton = false;
    this.Abandonable = true;
    this.MaxClaim = 1;
    this.Employer = {
      firstName: "Lucien",
      lastName: "Marek",
      email: "lmarek@protonvault.ch"
    };
    this.HackhubPost = {
      content: "Investigate an unknown person. Breach the systems, follow the fragments, recover the hidden evidence, and put the pieces together.",
      author: {
        name: "NEMESIS Protocol",
        avatar: NEMESIS_AVATAR
      },
      likes: 0
    };
    this.Objectives = [
      {
        name: "investigate_and_report",
        description: "Investigate Marek's network, take a lead on the purpose and send the info on tomasz.wrobel@gomail.com"
      }
    ];
  }
  CreateData() {
    const data = createAllNetworkData();
    return data;
  }
  OnStart() {
    const marekNetwork = this.Data.marekNetwork ?? createMarekNetworkIps();
    const sofiaKovalenkoNetwork = this.Data.sofiaKovalenkoNetwork ?? createSofiaKovalenkoNetworkIps();
    const elenaMarisVossNetwork = this.Data.elenaMarisVossNetwork ?? createElenaMarisVossNetworkIps();
    const adrianKenjiMoriNetwork = this.Data.adrianKenjiMoriNetwork ?? createAdrianKenjiMoriNetworkIps();
    const tomaszEliaszWrobelNetwork = this.Data.tomaszEliaszWrobelNetwork ?? createTomaszEliaszWrobelNetworkIps();
    const vaultNetwork = this.Data.vaultNetwork ?? createVaultNetworkIps();
    const ciaNetwork = this.Data.ciaNetwork ?? createCIANetworkIps();
    this.sendIntroductionMail(marekNetwork.routerIp);
    try {
      createMarekNetwork(marekNetwork);
      persistTracerouteRouterAddressRecords({
        "Lucien Marek": marekNetwork.routerIp
      });
    } catch {
    }
    try {
      createVaultNetwork(vaultNetwork);
    } catch {
    }
    try {
      createSofiaKovalenkoNetwork(sofiaKovalenkoNetwork);
      persistTracerouteRouterAddressRecords({
        "Sofia Nadiya Kovalenko": sofiaKovalenkoNetwork.routerIp
      });
    } catch {
    }
    try {
      createElenaMarisVossNetwork(elenaMarisVossNetwork);
      persistTracerouteRouterAddressRecords({
        "Elena Maris Voss": elenaMarisVossNetwork.routerIp
      });
    } catch {
    }
    try {
      createAdrianKenjiMoriNetwork(adrianKenjiMoriNetwork);
      persistTracerouteRouterAddressRecords({
        "Adrian Kenji Mori": adrianKenjiMoriNetwork.routerIp
      });
    } catch {
    }
    try {
      createTomaszEliaszWrobelNetwork(tomaszEliaszWrobelNetwork);
      persistTracerouteRouterAddressRecords({
        "Tomasz Eliasz Wrobel": tomaszEliaszWrobelNetwork.routerIp
      });
    } catch {
    }
    try {
      createCIANetwork(ciaNetwork);
    } catch {
    }
  }
  OnObjectivesStart() {
    this.Events.on("Mail.Sent", (mail) => {
      const fields = readRecoveredDataFields(mail.content);
      if (mail.to.trim().toLowerCase() !== TOMASZ_WROBEL_EMAIL) return;
      if (![RECOVERED_DATA_TEMPLATE_ID, RECOVERED_DATA_SUBJECT].includes(mail.subject.trim())) return;
      if (![NEMESIS_DATA_VALUE, "NemesisData.enc"].includes(fields.DATA?.trim() ?? "")) return;
      if (fields.NODE?.trim() !== NEMESIS_DATA_NODE_VALUE) return;
      import_hackhub_content_sdk10.Mail.send({
        from: TOMASZ_WROBEL_EMAIL,
        to: mail.from,
        subject: "Re: " + RECOVERED_DATA_SUBJECT,
        content: TOMASZ_RECOVERED_DATA_REPLY
      });
    });
  }
  OnComplete() {
  }
  OnAbandon() {
  }
  sendIntroductionMail(routerIp) {
    import_hackhub_content_sdk10.Mail.send({
      from: MAREK_SENDER,
      subject: "You were harder to find than expected",
      content: createIntroductionMail(routerIp),
      metadata: {
        modId: "nemesis-protocol-stage1",
        quest: this.Name,
        phase: "introduction",
        routerIp
      }
    });
  }
};
NemesisProtocolStage1Quest = __decorateClass([
  import_hackhub_content_sdk10.RegisterQuest
], NemesisProtocolStage1Quest);

// src/commands/MarianaInitCommand.ts
var import_hackhub_content_sdk12 = require("@hotbunny/hackhub-content-sdk");

// src/mari/MarianaResolverState.ts
var import_hackhub_content_sdk11 = require("@hotbunny/hackhub-content-sdk");
var MARIANA_RESOLVER_ACTIVE_KEY = "mariana.resolver.active";
var MARIANA_HOST = "index_nemesis.entry.hadal";
var MARIANA_URL = `mari://${MARIANA_HOST}`;
function setMarianaResolverActive(active) {
  import_hackhub_content_sdk11.Variables.set(MARIANA_RESOLVER_ACTIVE_KEY, active);
}
function isMarianaResolverActive() {
  return import_hackhub_content_sdk11.Variables.get(MARIANA_RESOLVER_ACTIVE_KEY) === true;
}
function resetMarianaResolver() {
  import_hackhub_content_sdk11.Variables.remove(MARIANA_RESOLVER_ACTIVE_KEY);
}

// src/commands/MarianaInitCommand.ts
var HELP_LINES = [
  "mari_init - Mariana's Web resolver initializer",
  "Usage:",
  "  mari_init [OPTIONS]",
  "Options:",
  "  Fingerprint, --fingerprint <VALUE>   Router or gateway fingerprint.",
  "  Layer,       --layer <NUMBER>        Depth layer to initialize. Values: 3, 6, 9.",
  "  Seed,        --seed <VALUE>          Pressure seed used to generate a route token.",
  "  Host,        --host <VALUE>          Target host address.",
  "  Help,        --help                  Show this help screen.",
  "Example:",
  "   mari_init --fingerprint NSA-7349-MARI --layer 9 --seed 7F4A9 --host 10.73.41.20"
];
var MARIANA_ASCII_LINES = [
  "+----------------------------------------------+",
  "|                M A R I A N A                 |",
  "|           HADAL ROUTING INTERFACE            |",
  "|             RESOLVER NODE ONLINE             |",
  "+----------------------------------------------+"
];
var VALIDATION_LINES = [
  { text: "mariana's resolver: online", delayAfterMs: 1e3 },
  { text: "pressure layer: 9", delayAfterMs: 1e3 },
  { text: "protocol: mari:// unlocked", delayAfterMs: 1e3 },
  { text: "route: stable", delayAfterMs: 1e3 },
  { text: "Cipher bloom: detected", delayAfterMs: 1e3 },
  { text: "Mariana's index: reachable", delayAfterMs: 3e3 }
];
var ROUTE_CHAIN_IPS = [
  "10.73.41.20",
  "10.88.14.9",
  "10.91.5.144",
  "10.109.37.6",
  "10.129.77.33",
  "10.144.210.87",
  "10.158.12.201",
  "10.176.92.18",
  "10.191.40.112",
  "10.212.8.59",
  "172.16.4.88",
  "172.17.90.12",
  "172.18.31.156",
  "172.19.7.43",
  "172.20.240.9",
  "172.21.66.121",
  "172.22.10.206",
  "172.23.88.77",
  "172.24.3.190",
  "172.25.41.52",
  "172.26.117.8",
  "172.27.72.164",
  "172.28.6.219",
  "172.29.155.14",
  "172.30.82.101",
  "172.31.44.66",
  "192.0.2.13",
  "192.0.2.44",
  "192.0.2.89",
  "192.0.2.177",
  "198.51.100.7",
  "198.51.100.26",
  "198.51.100.61",
  "198.51.100.108",
  "198.51.100.199",
  "203.0.113.5",
  "203.0.113.19",
  "203.0.113.74",
  "203.0.113.146",
  "203.0.113.228",
  "100.64.18.7",
  "100.66.90.41",
  "100.72.133.58",
  "100.81.24.191",
  "100.95.201.32",
  "100.104.77.143",
  "100.118.6.22",
  "100.123.211.98",
  "100.126.45.170",
  "186.222.45.133"
];
var VALID_ARGS = [
  "--fingerprint",
  "MRK-825F-MARI",
  "--layer",
  "9",
  "--seed",
  "85F9C",
  "--host",
  "186.222.45.133"
];
function printSpacedLine(tools, line) {
  tools.println(line);
  tools.newLine();
}
async function printSpacedLines(tools, lines, delayAfterMs = 0) {
  for (const line of lines) {
    printSpacedLine(tools, line);
    if (delayAfterMs > 0) {
      await tools.sleep(delayAfterMs);
    }
  }
}
function printHelp(tools) {
  for (const line of HELP_LINES) {
    printSpacedLine(tools, line);
  }
}
function isExactValidInvocation(args) {
  return args.length === VALID_ARGS.length && VALID_ARGS.every((expected, index) => args[index] === expected);
}
function getRandomRouteChainIp() {
  return ROUTE_CHAIN_IPS[Math.floor(Math.random() * ROUTE_CHAIN_IPS.length)] ?? ROUTE_CHAIN_IPS[0];
}
function printResolverScreen(tools, routeChainIp) {
  tools.clear();
  for (const line of MARIANA_ASCII_LINES) {
    printSpacedLine(tools, line);
  }
  for (const { text } of VALIDATION_LINES) {
    printSpacedLine(tools, text);
  }
  printSpacedLine(tools, `${MARIANA_URL} is now available.`);
  tools.println(`Route chain enabled: ${routeChainIp ?? getRandomRouteChainIp()}`);
}
async function printLoadingSequence(tools) {
  await printSpacedLines(tools, MARIANA_ASCII_LINES, 40);
  for (const { text, delayAfterMs } of VALIDATION_LINES) {
    printSpacedLine(tools, text);
    await tools.sleep(delayAfterMs);
  }
  printSpacedLine(tools, `${MARIANA_URL} is now available.`);
  setMarianaResolverActive(true);
  await tools.sleep(2e3);
}
var MarianaInitCommand = class extends import_hackhub_content_sdk12.Command {
  constructor() {
    super(...arguments);
    this.CommandName = "mari_init";
    this.Description = "Mariana's Web resolver initializer";
    this.PackageName = "mari_init";
    this.Autocomplete = [];
  }
  async Run(tools) {
    const args = tools.getArgs();
    if (args.length === 0) {
      tools.println("Error: Use mari_init --help for help");
      return;
    }
    if (args.length === 1 && args[0] === "--help") {
      printHelp(tools);
      return;
    }
    if (!isExactValidInvocation(args)) {
      tools.println("Error: Use --help for help");
      return;
    }
    tools.lock();
    try {
      setMarianaResolverActive(false);
      await printLoadingSequence(tools);
      while (isMarianaResolverActive()) {
        printResolverScreen(tools, getRandomRouteChainIp());
        await tools.sleep(1e3);
      }
    } finally {
      setMarianaResolverActive(false);
      tools.unlock();
    }
  }
};
MarianaInitCommand = __decorateClass([
  (0, import_hackhub_content_sdk12.RegisterCommand)({ scope: "local" })
], MarianaInitCommand);

// src/commands/TracerouteCommand.ts
var import_hackhub_content_sdk13 = require("@hotbunny/hackhub-content-sdk");
async function printSearchSequence(tools, identity) {
  tools.println(TRACE_ID);
  tools.println(`Resolving identity record: ${identity}`);
  await tools.sleep(1e3);
  tools.println("Searching civic aliases...");
  await tools.sleep(1e3);
  tools.println("Searching archived contact nodes...");
  await tools.sleep(1e3);
  tools.println("Searching private relay indexes...");
  await tools.sleep(3e3);
  tools.newLine();
}
var TracerouteCommand = class extends import_hackhub_content_sdk13.Command {
  constructor() {
    super(...arguments);
    this.CommandName = "traceroute";
    this.Description = "Resolve LinkForge personnel relay addresses";
    this.PackageName = "traceroute";
    this.Autocomplete = [];
  }
  async Run(tools) {
    const query = tools.getArgs().join(" ").trim();
    if (query === "--h") {
      tools.println("*Usage:  traceroute [Fullname]");
      return;
    }
    if (!query) {
      tools.println("Error: Usage: traceroute <LinkForge full name>");
      return;
    }
    const canonicalName = getCanonicalLinkForgeProfileFullName(query);
    await printSearchSequence(tools, canonicalName ?? query);
    if (!canonicalName) {
      tools.println("NO MATCH");
      return;
    }
    const resolvedAddress = getTracerouteRouterAddressRecords()[canonicalName];
    if (!resolvedAddress) {
      tools.println("NO MATCH");
      return;
    }
    tools.println("MATCH FOUND");
    tools.println(`Name: ${canonicalName}`);
    tools.println(`Record Type: ${TRACE_RECORD_TYPE}`);
    tools.println("Status: ACTIVE");
    tools.println(`Resolved Address: ${resolvedAddress}`);
  }
};
TracerouteCommand = __decorateClass([
  (0, import_hackhub_content_sdk13.RegisterCommand)({ scope: "local" })
], TracerouteCommand);

// src/websites/LinkForgeWebsite.ts
var import_hackhub_content_sdk14 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/home.html
var home_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LinkForge</title>
  <link rel="stylesheet" href="linkforge/linkforge.css" />
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a>
      <form class="search-wrap site-search" action="https://linkforge.com/search" method="get">
        <button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button>
        <input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" />
        <div class="search-suggestions" hidden></div>
      </form>
      <nav class="primary-nav">
        <a class="nav-item active" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a>
        <a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a>
        <a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a>
        <a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a>
        <a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a>
        <span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span>
        <a class="nav-item business-nav" href="/business"><span class="nav-icon">\u25A6</span><span>For Business \u25BE</span></a>
        <a class="premium-link" href="/premium">Try Premium for free</a>
      </nav>
    </div>
  </header>

  <main class="page-shell home-grid">
    <aside class="left-rail">
      <section class="card guest-card">
        <img class="guest-card-logo" src="linkforge/assets/linkforge-logo-square.png" alt="LinkForge" />
        <h2>Welcome to LinkForge</h2>
        <p>Sign in to connect with professionals, follow organizations, and join industry conversations.</p>
        <button class="guest-card-signin" type="button">Sign in</button>
        <button class="guest-card-join" type="button">New to LinkForge? Join now</button>
      </section>
      <section class="card card-pad small">
        <a class="blue-link" href="/groups">Groups</a><br /><br />
        <a class="blue-link" href="/events">Events</a><br /><br />
        <a class="blue-link" href="/newsletters">Newsletters</a>
        <div class="divider"></div>
        <strong>Discover more</strong>
      </section>
    </aside>

    <section class="feed-column">
      <section class="card guest-feed-prompt">
        <div>
          <h2>Join the professional conversation</h2>
          <p>Sign in to create posts, follow people, and connect with professionals.</p>
        </div>
        <button class="guest-feed-signin" type="button">Sign in</button>
      </section>
      <div class="feed-sort">Sort by: <strong>Top \u25BE</strong></div>

      <div id="feed">
        <article class="card post">
          <div class="post-head">
            <img class="avatar" src="linkforge/assets/ava-ramos.png" alt="Ava Ramos" />
            <div>
              <a class="post-author" href="/in/ava-ramos">Ava Ramos</a>
              <div class="post-meta">Systems Reliability Lead at Northstar Compute<br />2h \xB7 \u{1F310}</div>
            </div>
            <a class="follow" href="/in/ava-ramos">+ Follow</a>
          </div>
          <div class="post-body"><p>Resilience is not just redundancy. It is the ability to explain what happened after every layer has failed. Proud of our team for completing a full continuity exercise across three regions this week.</p></div>
          <img class="post-image" src="linkforge/assets/post-office-meeting.jpg" alt="A team meeting in a modern office" />
          <div class="social-counts"><span><span class="reaction-dot">\u2713</span> Ava and 184 others</span><span>21 comments \xB7 4 reposts</span></div>
          <div class="action-row"><span class="action">Like</span><span class="action">Comment</span><span class="action">Repost</span><span class="action">Send</span></div>
        </article>

        <article class="card post">
          <div class="post-head">
            <img class="avatar" src="linkforge/assets/quanta-corp.png" alt="Quanta Cloud" />
            <div>
              <a class="post-author" href="/company/quanta-cloud">Quanta Cloud</a>
              <div class="post-meta">76,218 followers<br /><span class="sponsored">Promoted</span></div>
            </div>
            <a class="follow" href="/company/quanta-cloud">+ Follow</a>
          </div>
          <div class="post-body"><p>Move critical archives without losing custody. Quanta Cloud combines immutable retention, regional isolation, and continuous evidence logging.</p></div>
          <img class="post-image" src="linkforge/assets/post-datacenter.jpg" alt="Secure data center racks" />
          <div class="social-counts"><span><span class="reaction-dot">\u2713</span> 812</span><span>44 comments \xB7 17 reposts</span></div>
          <div class="action-row"><span class="action">Like</span><span class="action">Comment</span><span class="action">Repost</span><span class="action">Send</span></div>
        </article>

        <article class="card post">
          <div class="post-head">
            <img class="avatar" src="linkforge/assets/peter-kessler.png" alt="Peter Kessler" />
            <div>
              <a class="post-author" href="/in/peter-kessler">Peter Kessler</a>
              <div class="post-meta">Programme Chair, European Systems Forum<br />5h \xB7 \u{1F310}</div>
            </div>
            <a class="follow" href="/in/peter-kessler">+ Follow</a>
          </div>
          <div class="post-body"><p>Registration is open for this year's European Systems Forum. The closing session will examine a difficult question: who controls the record when every custodian has an interest in changing it?</p></div>
          <img class="post-image" src="linkforge/assets/post-conference.jpg" alt="European Systems Forum announcement" />
          <div class="social-counts"><span><span class="reaction-dot">\u2713</span> 326</span><span>38 comments \xB7 12 reposts</span></div>
          <div class="action-row"><span class="action">Like</span><span class="action">Comment</span><span class="action">Repost</span><span class="action">Send</span></div>
        </article>

        <article class="card post">
          <div class="post-head">
            <img class="avatar" src="linkforge/assets/elena-morin.png" alt="Elena Morin" />
            <div>
              <a class="post-author" href="/in/elena-morin">Dr. Elena Morin</a>
              <div class="post-meta">Director of Research, Helix Institute<br />1d \xB7 \u{1F310}</div>
            </div>
            <a class="follow" href="/in/elena-morin">+ Follow</a>
          </div>
          <div class="post-body"><p>Applications are now open for the Helix Fellowship in Applied Systems Research. We are looking for candidates who can bridge computational science, archival integrity, and public accountability.</p></div>
          <img class="post-image" src="linkforge/assets/post-lab.jpg" alt="Applied systems research laboratory" />
          <div class="social-counts"><span><span class="reaction-dot">\u2713</span> 491</span><span>29 comments \xB7 23 reposts</span></div>
          <div class="action-row"><span class="action">Like</span><span class="action">Comment</span><span class="action">Repost</span><span class="action">Send</span></div>
        </article>
      </div>
    </section>

    <aside class="right-rail">
      <section class="card news-card">
        <h2 class="news-title">LinkForge News <span>\u24D8</span></h2>
        <a class="news-item" href="/news/continuity"><div class="news-headline">Archive continuity becomes board priority</div><div class="news-meta">2h ago \xB7 1,284 readers</div></a>
        <a class="news-item" href="/news/quantum"><div class="news-headline">Quantum security funding accelerates</div><div class="news-meta">4h ago \xB7 932 readers</div></a>
        <a class="news-item" href="/news/work"><div class="news-headline">Four-day research pilots expand</div><div class="news-meta">7h ago \xB7 614 readers</div></a>
        <a class="news-item" href="/news/regulation"><div class="news-headline">New rules target unverifiable AI claims</div><div class="news-meta">10h ago \xB7 2,103 readers</div></a>
        <a class="news-item" href="/news/science"><div class="news-headline">Independent labs reshape public research</div><div class="news-meta">1d ago \xB7 789 readers</div></a>
        <span class="show-more">Show more \u25BE</span>
      </section>
      <section class="card ad-card">
        <div class="sponsored">Ad \xB7\u2022\u2022\u2022</div>
        <img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" />
        <h3>Protect the record, not just the server</h3>
        <p>Evidence-grade storage for regulated teams.</p>
        <a class="outline-button" href="/company/quanta-cloud">Follow</a>
      </section>
      <footer class="footer-links">
        <a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br />
        <a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br />
        <span class="footer-brand">LinkForge</span> Corporation \xA9 2026
      </footer>
    </aside>
  </main>

  <script src="linkforge/linkforge-search.js"></script>
  <script>
  (function () {
    var feed = document.getElementById('feed');
    var cards = Array.prototype.slice.call(feed.children);
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temporary = cards[i]; cards[i] = cards[j]; cards[j] = temporary;
    }
    cards.forEach(function (card) { feed.appendChild(card); });
  })();
  </script>
</body>
</html>
`;

// src/websites/pages/search.html
var search_default = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Search | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head><body>
<header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input id="searchInput" class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item active" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>
<main class="page-shell search-grid"><section><div class="card search-header-card"><div class="filters"><button class="filter-pill active">People</button><button class="filter-pill">Posts</button><button class="filter-pill">Jobs</button><button class="filter-pill">Companies</button><button class="filter-pill">Groups</button><button class="filter-pill">All filters</button></div></div><div class="card result-card" id="resultsCard"><div class="result-label" id="resultLabel">People results</div><div id="emptySearch" class="no-results"><h2>Search for people</h2><p>Enter a name, field, employer, school, or location to find professional profiles.</p></div><div id="resultsList">
        <div class="person-result profile-search-result" data-profile-slug="lucien-marek" hidden>
          <a href="/in/lucien-marek"><img src="linkforge/assets/lucien-marek.png" alt="Lucien Marek" /></a>
          <div><a class="person-name" href="/in/lucien-marek">Lucien Marek</a><div class="person-headline">Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics</div><div class="person-location">Geneva, Switzerland \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Senior Scientific Adviser (retired) at European Archival Continuity Programme</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="elena-maris-voss" hidden>
          <a href="/in/elena-maris-voss"><img src="linkforge/assets/elena-maris-voss.png" alt="Dr. Elena Maris Voss" /></a>
          <div><a class="person-name" href="/in/elena-maris-voss">Dr. Elena Maris Voss</a><div class="person-headline">Quantum Communications &amp; Radiation-Hardened Systems Architect</div><div class="person-location">Innsbruck, Austria \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Independent Scientific Infrastructure Adviser at Multinational Scientific Infrastructure Programs</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="malik-jonathan-reyes" hidden>
          <a href="/in/malik-jonathan-reyes"><img src="linkforge/assets/malik-jonathan-reyes.png" alt="Dr. Malik Jonathan Reyes" /></a>
          <div><a class="person-name" href="/in/malik-jonathan-reyes">Dr. Malik Jonathan Reyes</a><div class="person-headline">Director of Autonomous Security Research | AI &amp; Mission Systems</div><div class="person-location">San Antonio, Texas, United States \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Director of Autonomous Security Research at Meridian Institute of Technology</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="sofia-nadiya-kovalenko" hidden>
          <a href="/in/sofia-nadiya-kovalenko"><img src="linkforge/assets/sofia-nadiya-kovalenko.png" alt="Professor Sofia Nadiya Kovalenko" /></a>
          <div><a class="person-name" href="/in/sofia-nadiya-kovalenko">Professor Sofia Nadiya Kovalenko</a><div class="person-headline">Professor of Experimental Physics | Detector Systems &amp; Signal Reconstruction</div><div class="person-location">Odesa, Ukraine \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Professor of Experimental Physics at St. Aurelian Institute, Geneva</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="adrian-kenji-mori" hidden>
          <a href="/in/adrian-kenji-mori"><img src="linkforge/assets/adrian-kenji-mori.png" alt="Dr. Adrian Kenji Mori" /></a>
          <div><a class="person-name" href="/in/adrian-kenji-mori">Dr. Adrian Kenji Mori</a><div class="person-headline">Chief Scientist | Embedded Systems &amp; Spacecraft Firmware Security</div><div class="person-location">Yokohama, Japan \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Chief Scientist at Kestrel Zero Laboratory</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="amina-celine-okafor" hidden>
          <a href="/in/amina-celine-okafor"><img src="linkforge/assets/amina-celine-okafor.png" alt="Dr. Amina Celine Okafor" /></a>
          <div><a class="person-name" href="/in/amina-celine-okafor">Dr. Amina Celine Okafor</a><div class="person-headline">Director of Extreme Environments Medicine | Computational Biology</div><div class="person-location">Lagos, Nigeria \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Director of Extreme Environments Medicine at Orison Biomedical Foundation</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="lucas-matteo-ferran" hidden>
          <a href="/in/lucas-matteo-ferran"><img src="linkforge/assets/lucas-matteo-ferran.png" alt="Dr. Lucas Matteo Ferran" /></a>
          <div><a class="person-name" href="/in/lucas-matteo-ferran">Dr. Lucas Matteo Ferran</a><div class="person-headline">Technical Director | Cryogenics &amp; Superconducting Systems</div><div class="person-location">Turin, Italy \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Technical Director at Borealis Containment Group</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="priya-anjali-menon" hidden>
          <a href="/in/priya-anjali-menon"><img src="linkforge/assets/priya-anjali-menon.png" alt="Dr. Priya Anjali Menon" /></a>
          <div><a class="person-name" href="/in/priya-anjali-menon">Dr. Priya Anjali Menon</a><div class="person-headline">Lead Analyst | Satellite Geodesy, Remote Sensing &amp; Covert Signal Analysis</div><div class="person-location">Kochi, India \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Lead Analyst at Global Observation Security Bureau</div></div>
          <button class="connect-button">Connect</button>
        </div>
        <div class="person-result profile-search-result" data-profile-slug="tomasz-eliasz-wrobel" hidden>
          <a href="/in/tomasz-eliasz-wrobel"><img src="linkforge/assets/tomasz-eliasz-wrobel.png" alt="Dr. Tomasz Eliasz Wrobel" /></a>
          <div><a class="person-name" href="/in/tomasz-eliasz-wrobel">Dr. Tomasz Eliasz Wrobel</a><div class="person-headline">Principal Investigator | Cryptography &amp; Secure Scientific Computing</div><div class="person-location">Gdansk, Poland \xB7 500+ connections</div><div class="small subtle" style="margin-top:8px">Principal Investigator at Atlas Cipher Laboratory</div></div>
          <button class="connect-button">Connect</button>
        </div>
        </div><div id="noResults" class="no-results" hidden><h2>No people results found</h2><p>Try searching for a full name, surname, field, company, school, or location.</p></div></div></section><aside class="right-rail"><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Make every record defensible</h3><p>Audit-ready retention for science and industry.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>
<script src="linkforge/linkforge-search.js"></script>
<script>(function(){var exportedQuery=typeof linkForgeSearchQuery!=='undefined'?String(linkForgeSearchQuery):'';var input=document.getElementById('searchInput');input.value=exportedQuery;var slugs=[];try{if(typeof linkForgeSearchResultsJson!=='undefined')slugs=JSON.parse(String(linkForgeSearchResultsJson));}catch(e){slugs=[];}if(!slugs.length&&exportedQuery&&window.LinkForgeFindProfileMatches){slugs=window.LinkForgeFindProfileMatches(exportedQuery).map(function(p){return p.slug;});}var cards=Array.prototype.slice.call(document.querySelectorAll('.profile-search-result'));var empty=document.getElementById('emptySearch');var none=document.getElementById('noResults');var label=document.getElementById('resultLabel');if(!exportedQuery){empty.hidden=false;none.hidden=true;cards.forEach(function(c){c.hidden=true;});label.textContent='People results';return;}empty.hidden=true;var shown=0;cards.forEach(function(c){var show=slugs.indexOf(c.getAttribute('data-profile-slug'))!==-1;c.hidden=!show;if(show)shown++;});none.hidden=shown!==0;label.textContent=shown+' people result'+(shown===1?'':'s')+' for \u201C'+exportedQuery+'\u201D';})();</script>
</body></html>`;

// src/websites/pages/generic.html
var generic_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>LinkForge</title>\n  <link rel="stylesheet" href="linkforge/linkforge.css" />\n</head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div>\n      </form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell" style="max-width:804px">\n    <section class="card section" style="min-height:360px;text-align:center;padding-top:90px">\n      <img class="generic-brand-logo" src="linkforge/assets/linkforge-logo.png" alt="LinkForge" />\n      <h1 id="pageTitle" style="font-size:24px">LinkForge</h1>\n      <p class="subtle">This area is not available in the local archive.</p>\n      <p style="margin-top:22px"><a class="primary-button" href="/">Return to Home</a></p>\n    </section>\n  </main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body>\n</html>\n';

// src/websites/pages/marek-profile.html
var marek_profile_default = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Lucien Marek | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>
<body>
  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>
  <main class="page-shell profile-grid"><section>
    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/lucien-marek.png" alt="Lucien Marek" /><div class="profile-main-row"><div><h1 class="profile-name">Lucien Marek</h1><div class="profile-headline">Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics</div><div class="profile-location">Geneva, Switzerland \xB7 <a class="blue-link" href="/search?q=Geneva, Switzerland">Contact info</a></div><a class="blue-link" href="/network/lucien-marek">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">EAC</span>European Archival Continuity Programme</div><div class="profile-company"><span class="company-logo">EZR</span>ETH Z\xFCrich</div></div></div></div></article>
    <article class="card section"><h2>About</h2><p>Retired systems scientist with more than four decades of work in computational physics, secure computation, and long-term archival integrity. Marek's research focused on preserving evidence when institutions, networks, and custodians could no longer be assumed trustworthy.</p>        <!-- PROFILE BIO CLUE SLOT: add the final investigation detail here in a later build. -->
    </article>
    <article class="card section"><h2>Experience</h2>
        <div class="timeline-item"><div class="timeline-logo">EAC</div><div><div class="timeline-title">Senior Scientific Adviser</div><div class="timeline-org">European Archival Continuity Programme \xB7 Contract</div><div class="timeline-date">Jan 2014 - Dec 2021 \xB7 8 yrs</div><div class="timeline-place">Geneva, Switzerland \xB7 Hybrid</div><p class="timeline-copy">Advised public research archives on distributed custody, provenance verification, and recovery planning for politically sensitive scientific records.</p></div></div>
        <div class="timeline-item"><div class="timeline-logo">HI</div><div><div class="timeline-title">Director, Secure Systems Group</div><div class="timeline-org">Helix Institute for Applied Computation \xB7 Full-time</div><div class="timeline-date">Sep 1999 - Dec 2013 \xB7 14 yrs 4 mos</div><div class="timeline-place">Lausanne, Switzerland</div><p class="timeline-copy">Led interdisciplinary teams studying fault-tolerant computation, evidence-preserving storage, and adversarial failure in institutional networks.</p></div></div>
        <div class="timeline-item"><div class="timeline-logo">VD</div><div><div class="timeline-title">Principal Research Scientist</div><div class="timeline-org">Vektor Dynamics AG \xB7 Full-time</div><div class="timeline-date">Jun 1987 - Aug 1999 \xB7 12 yrs 3 mos</div><div class="timeline-place">Z\xFCrich, Switzerland</div></div></div>
    </article>
    <article class="card section"><h2>Education</h2>
        <div class="timeline-item"><div class="timeline-logo">ETH</div><div><div class="timeline-title">ETH Z\xFCrich</div><div class="timeline-org">Doctor of Philosophy - PhD, Computational Physics</div><div class="timeline-date">1978 - 1982</div></div></div>
        <div class="timeline-item"><div class="timeline-logo">PIT</div><div><div class="timeline-title">Prague Institute of Technology</div><div class="timeline-org">Master of Science - MSc, Applied Mathematics</div><div class="timeline-date">1973 - 1978</div></div></div>
    </article>
    <article class="card section"><h2>Skills</h2>
        <div class="skill"><span>Distributed Systems</span><span class="endorse">42 endorsements</span></div>
        <div class="skill"><span>Archival Integrity</span><span class="endorse">37 endorsements</span></div>
        <div class="skill"><span>Computational Physics</span><span class="endorse">31 endorsements</span></div>
        <div class="skill"><span>Applied Cryptography</span><span class="endorse">25 endorsements</span></div>
    </article>
  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>
        <a class="person-small" href="/in/elena-maris-voss"><img src="linkforge/assets/elena-maris-voss.png" alt="Dr. Elena Maris Voss" /><div><strong>Dr. Elena Maris Voss</strong><span>Quantum Communications &amp; Radiation-Hardened Systems Architect</span></div></a>
        <a class="person-small" href="/in/malik-jonathan-reyes"><img src="linkforge/assets/malik-jonathan-reyes.png" alt="Dr. Malik Jonathan Reyes" /><div><strong>Dr. Malik Jonathan Reyes</strong><span>Director of Autonomous Security Research | AI &amp; Mission Systems</span></div></a>
        <a class="person-small" href="/in/sofia-nadiya-kovalenko"><img src="linkforge/assets/sofia-nadiya-kovalenko.png" alt="Professor Sofia Nadiya Kovalenko" /><div><strong>Professor Sofia Nadiya Kovalenko</strong><span>Professor of Experimental Physics | Detector Systems &amp; Signal Reconstruction</span></div></a>
      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>
  <script src="linkforge/linkforge-search.js"></script>
</body></html>`;

// src/websites/pages/elena-maris-voss-profile.html
var elena_maris_voss_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Elena Maris Voss | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/elena-maris-voss.png" alt="Dr. Elena Maris Voss" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Elena Maris Voss</h1><div class="profile-headline">Quantum Communications &amp; Radiation-Hardened Systems Architect</div><div class="profile-location">Innsbruck, Austria \xB7 <a class="blue-link" href="/search?q=Innsbruck, Austria">Contact info</a></div><a class="blue-link" href="/network/elena-maris-voss">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">MSI</span>Multinational Scientific Infrastructure Programs</div><div class="profile-company"><span class="company-logo">EZR</span>ETH Z\xFCrich</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Elena Maris Voss is a physicist and systems architect known for designing quantum-secure communication systems for high-radiation and deep-space environments. Colleagues describe her as precise, private, and unusually resistant to bureaucratic pressure. Her work focused on preventing signal interception, hardware corruption, and identity spoofing in isolated research networks.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">HPL</div>\n          <div><div class="timeline-title">Research Fellow</div><div class="timeline-org">Helix Photonics Laboratory, Zurich</div><div class="timeline-date">2008\u20132011</div><div class="timeline-place">Innsbruck, Austria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ESS</div>\n          <div><div class="timeline-title">Secure Communications Engineer</div><div class="timeline-org">European Space Systems Directorate</div><div class="timeline-date">2011\u20132016</div><div class="timeline-place">Innsbruck, Austria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NDS</div>\n          <div><div class="timeline-title">Consulting Physicist</div><div class="timeline-org">NASA deep-space communications research</div><div class="timeline-date">2016\u20132021</div><div class="timeline-place">Innsbruck, Austria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">MSI</div>\n          <div><div class="timeline-title">Independent Adviser</div><div class="timeline-org">Multinational scientific infrastructure programs</div><div class="timeline-date">2021\u2013Present</div><div class="timeline-place">Innsbruck, Austria</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOV</div>\n          <div><div class="timeline-title">University of Vienna</div><div class="timeline-org">B.Sc. in Applied Physics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">EZ</div>\n          <div><div class="timeline-title">ETH Zurich</div><div class="timeline-org">M.Sc. in Quantum Information Science</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOC</div>\n          <div><div class="timeline-title">University of Cambridge</div><div class="timeline-org">Ph.D. in Experimental Physics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ESR</div>\n          <div><div class="timeline-title">European Space Research and Technology Centre</div><div class="timeline-org">Postdoctoral research in radiation-tolerant photonics</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Quantum Communications</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Radiation-Hardened Computing</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Photonics</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Secure Systems Architecture</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/malik-jonathan-reyes"><img src="linkforge/assets/malik-jonathan-reyes.png" alt="Dr. Malik Jonathan Reyes" /><div><strong>Dr. Malik Jonathan Reyes</strong><span>Director of Autonomous Security Research | AI &amp; Mission Systems</span></div></a>\n        <a class="person-small" href="/in/sofia-nadiya-kovalenko"><img src="linkforge/assets/sofia-nadiya-kovalenko.png" alt="Professor Sofia Nadiya Kovalenko" /><div><strong>Professor Sofia Nadiya Kovalenko</strong><span>Professor of Experimental Physics | Detector Systems &amp; Signal Reconstruction</span></div></a>\n        <a class="person-small" href="/in/adrian-kenji-mori"><img src="linkforge/assets/adrian-kenji-mori.png" alt="Dr. Adrian Kenji Mori" /><div><strong>Dr. Adrian Kenji Mori</strong><span>Chief Scientist | Embedded Systems &amp; Spacecraft Firmware Security</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/malik-jonathan-reyes-profile.html
var malik_jonathan_reyes_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Malik Jonathan Reyes | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/malik-jonathan-reyes.png" alt="Dr. Malik Jonathan Reyes" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Malik Jonathan Reyes</h1><div class="profile-headline">Director of Autonomous Security Research | AI &amp; Mission Systems</div><div class="profile-location">San Antonio, Texas, United States \xB7 <a class="blue-link" href="/search?q=San Antonio, Texas, United States">Contact info</a></div><a class="blue-link" href="/network/malik-jonathan-reyes">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">MIO</span>Meridian Institute of Technology</div><div class="profile-company"><span class="company-logo">MIO</span>Massachusetts Institute of Technology</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Malik Jonathan Reyes is a computer scientist who specialized in autonomous decision systems for spacecraft, unmanned research vehicles, and emergency infrastructure. His research explored how artificial intelligence could continue operating when human operators were unavailable, misinformed, or under active cyberattack.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">RMD</div>\n          <div><div class="timeline-title">Robotics Engineer</div><div class="timeline-org">Red Mesa Dynamics</div><div class="timeline-date">2007\u20132010</div><div class="timeline-place">San Antonio, Texas, United States</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NJP</div>\n          <div><div class="timeline-title">Autonomous Systems Researcher</div><div class="timeline-org">NASA Jet Propulsion Laboratory contractor</div><div class="timeline-date">2010\u20132015</div><div class="timeline-place">San Antonio, Texas, United States</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">USA</div>\n          <div><div class="timeline-title">Technical Lead</div><div class="timeline-org">U.S. Advanced Infrastructure Resilience Office</div><div class="timeline-date">2015\u20132019</div><div class="timeline-place">San Antonio, Texas, United States</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">MIO</div>\n          <div><div class="timeline-title">Director of Autonomous Security Research</div><div class="timeline-org">Meridian Institute of Technology</div><div class="timeline-date">2019\u2013Present</div><div class="timeline-place">San Antonio, Texas, United States</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOT</div>\n          <div><div class="timeline-title">University of Texas at Austin</div><div class="timeline-org">B.S. in Computer Engineering</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">CMU</div>\n          <div><div class="timeline-title">Carnegie Mellon University</div><div class="timeline-org">M.S. in Artificial Intelligence</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">MIO</div>\n          <div><div class="timeline-title">Massachusetts Institute of Technology</div><div class="timeline-org">Ph.D. in Autonomous Systems</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">HDI</div>\n          <div><div class="timeline-title">Harriman Defense Institute</div><div class="timeline-org">Executive certificate in National Security Technology Policy</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Artificial Intelligence</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Autonomous Systems</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Mission Resilience</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Robotics</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/sofia-nadiya-kovalenko"><img src="linkforge/assets/sofia-nadiya-kovalenko.png" alt="Professor Sofia Nadiya Kovalenko" /><div><strong>Professor Sofia Nadiya Kovalenko</strong><span>Professor of Experimental Physics | Detector Systems &amp; Signal Reconstruction</span></div></a>\n        <a class="person-small" href="/in/adrian-kenji-mori"><img src="linkforge/assets/adrian-kenji-mori.png" alt="Dr. Adrian Kenji Mori" /><div><strong>Dr. Adrian Kenji Mori</strong><span>Chief Scientist | Embedded Systems &amp; Spacecraft Firmware Security</span></div></a>\n        <a class="person-small" href="/in/amina-celine-okafor"><img src="linkforge/assets/amina-celine-okafor.png" alt="Dr. Amina Celine Okafor" /><div><strong>Dr. Amina Celine Okafor</strong><span>Director of Extreme Environments Medicine | Computational Biology</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/sofia-nadiya-kovalenko-profile.html
var sofia_nadiya_kovalenko_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Professor Sofia Nadiya Kovalenko | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/sofia-nadiya-kovalenko.png" alt="Professor Sofia Nadiya Kovalenko" /><div class="profile-main-row"><div><h1 class="profile-name">Professor Sofia Nadiya Kovalenko</h1><div class="profile-headline">Professor of Experimental Physics | Detector Systems &amp; Signal Reconstruction</div><div class="profile-location">Odesa, Ukraine \xB7 <a class="blue-link" href="/search?q=Odesa, Ukraine">Contact info</a></div><a class="blue-link" href="/network/sofia-nadiya-kovalenko">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">SAI</span>St. Aurelian Institute, Geneva</div><div class="profile-company"><span class="company-logo">UOG</span>University of Geneva</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Sofia Nadiya Kovalenko is a high-energy physicist and detector specialist who became known for reconstructing weak signals buried beneath extreme levels of electronic noise. Her expertise made her valuable not only in particle physics but also in covert monitoring systems, radiation detection, and forensic data recovery.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UNP</div>\n          <div><div class="timeline-title">Detector Calibration Scientist</div><div class="timeline-org">Ukrainian National Physics Centre</div><div class="timeline-date">2005\u20132009</div><div class="timeline-place">Odesa, Ukraine</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">CEI</div>\n          <div><div class="timeline-title">Senior Research Physicist</div><div class="timeline-org">CERN experimental instrumentation group</div><div class="timeline-date">2009\u20132017</div><div class="timeline-place">Odesa, Ukraine</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ESM</div>\n          <div><div class="timeline-title">Scientific Adviser</div><div class="timeline-org">European Strategic Monitoring Directorate</div><div class="timeline-date">2017\u20132022</div><div class="timeline-place">Odesa, Ukraine</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">SAI</div>\n          <div><div class="timeline-title">Professor of Experimental Physics</div><div class="timeline-org">St. Aurelian Institute, Geneva</div><div class="timeline-date">2022\u2013Present</div><div class="timeline-place">Odesa, Ukraine</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">OII</div>\n          <div><div class="timeline-title">Odesa I. I. Mechnikov National University</div><div class="timeline-org">B.Sc. in Physics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">TSN</div>\n          <div><div class="timeline-title">Taras Shevchenko National University of Kyiv</div><div class="timeline-org">M.Sc. in Nuclear and Particle Physics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOG</div>\n          <div><div class="timeline-title">University of Geneva</div><div class="timeline-org">Ph.D. in High-Energy Physics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">C</div>\n          <div><div class="timeline-title">CERN</div><div class="timeline-org">Research fellowship in detector calibration</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>High-Energy Physics</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Detector Calibration</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Signal Reconstruction</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Radiation Detection</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/adrian-kenji-mori"><img src="linkforge/assets/adrian-kenji-mori.png" alt="Dr. Adrian Kenji Mori" /><div><strong>Dr. Adrian Kenji Mori</strong><span>Chief Scientist | Embedded Systems &amp; Spacecraft Firmware Security</span></div></a>\n        <a class="person-small" href="/in/amina-celine-okafor"><img src="linkforge/assets/amina-celine-okafor.png" alt="Dr. Amina Celine Okafor" /><div><strong>Dr. Amina Celine Okafor</strong><span>Director of Extreme Environments Medicine | Computational Biology</span></div></a>\n        <a class="person-small" href="/in/lucas-matteo-ferran"><img src="linkforge/assets/lucas-matteo-ferran.png" alt="Dr. Lucas Matteo Ferran" /><div><strong>Dr. Lucas Matteo Ferran</strong><span>Technical Director | Cryogenics &amp; Superconducting Systems</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/adrian-kenji-mori-profile.html
var adrian_kenji_mori_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Adrian Kenji Mori | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/adrian-kenji-mori.png" alt="Dr. Adrian Kenji Mori" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Adrian Kenji Mori</h1><div class="profile-headline">Chief Scientist | Embedded Systems &amp; Spacecraft Firmware Security</div><div class="profile-location">Yokohama, Japan \xB7 <a class="blue-link" href="/search?q=Yokohama, Japan">Contact info</a></div><a class="blue-link" href="/network/adrian-kenji-mori">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">KZL</span>Kestrel Zero Laboratory</div><div class="profile-company"><span class="company-logo">SU</span>Stanford University</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Adrian Kenji Mori is a cybersecurity engineer specializing in embedded operating systems, satellite firmware, and compromised hardware recovery. He built his reputation by identifying vulnerabilities that persisted below the operating-system level, including malicious bootloaders, altered microcode, and falsified sensor output.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">SOE</div>\n          <div><div class="timeline-title">Firmware Engineer</div><div class="timeline-org">Shinsei Orbital Electronics</div><div class="timeline-date">2009\u20132013</div><div class="timeline-place">Yokohama, Japan</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NAS</div>\n          <div><div class="timeline-title">Cybersecurity Specialist</div><div class="timeline-org">NASA aerospace systems contractor</div><div class="timeline-date">2013\u20132018</div><div class="timeline-place">Yokohama, Japan</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">CTI</div>\n          <div><div class="timeline-title">Embedded Security Consultant</div><div class="timeline-org">CERN technical infrastructure division</div><div class="timeline-date">2018\u20132023</div><div class="timeline-place">Yokohama, Japan</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">KZL</div>\n          <div><div class="timeline-title">Chief Scientist</div><div class="timeline-org">Kestrel Zero Laboratory</div><div class="timeline-date">2023\u2013Present</div><div class="timeline-place">Yokohama, Japan</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOT</div>\n          <div><div class="timeline-title">University of Tokyo</div><div class="timeline-org">B.Eng. in Electrical and Electronic Engineering</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">KU</div>\n          <div><div class="timeline-title">Keio University</div><div class="timeline-org">M.Sc. in Embedded Systems</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">SU</div>\n          <div><div class="timeline-title">Stanford University</div><div class="timeline-org">Ph.D. in Computer Security</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">PAS</div>\n          <div><div class="timeline-title">Pacific Aerospace Security Academy</div><div class="timeline-org">Specialist training in orbital systems assurance</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Embedded Security</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Spacecraft Firmware</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Hardware Recovery</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Secure Boot</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/amina-celine-okafor"><img src="linkforge/assets/amina-celine-okafor.png" alt="Dr. Amina Celine Okafor" /><div><strong>Dr. Amina Celine Okafor</strong><span>Director of Extreme Environments Medicine | Computational Biology</span></div></a>\n        <a class="person-small" href="/in/lucas-matteo-ferran"><img src="linkforge/assets/lucas-matteo-ferran.png" alt="Dr. Lucas Matteo Ferran" /><div><strong>Dr. Lucas Matteo Ferran</strong><span>Technical Director | Cryogenics &amp; Superconducting Systems</span></div></a>\n        <a class="person-small" href="/in/priya-anjali-menon"><img src="linkforge/assets/priya-anjali-menon.png" alt="Dr. Priya Anjali Menon" /><div><strong>Dr. Priya Anjali Menon</strong><span>Lead Analyst | Satellite Geodesy, Remote Sensing &amp; Covert Signal Analysis</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/amina-celine-okafor-profile.html
var amina_celine_okafor_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Amina Celine Okafor | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/amina-celine-okafor.png" alt="Dr. Amina Celine Okafor" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Amina Celine Okafor</h1><div class="profile-headline">Director of Extreme Environments Medicine | Computational Biology</div><div class="profile-location">Lagos, Nigeria \xB7 <a class="blue-link" href="/search?q=Lagos, Nigeria">Contact info</a></div><a class="blue-link" href="/network/amina-celine-okafor">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">OBF</span>Orison Biomedical Foundation</div><div class="profile-company"><span class="company-logo">JHU</span>Johns Hopkins University</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Amina Celine Okafor is a computational biologist who studies how human physiology responds to radiation, isolation, sleep deprivation, and prolonged exposure to artificial environments. Her work bridges biomedical science, predictive modeling, and mission planning for high-risk research operations.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">WAG</div>\n          <div><div class="timeline-title">Bioinformatics Researcher</div><div class="timeline-org">West African Genomic Medicine Centre</div><div class="timeline-date">2010\u20132013</div><div class="timeline-place">Lagos, Nigeria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NLS</div>\n          <div><div class="timeline-title">Human Performance Analyst</div><div class="timeline-org">NASA life-sciences contractor</div><div class="timeline-date">2013\u20132018</div><div class="timeline-place">Lagos, Nigeria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">CRH</div>\n          <div><div class="timeline-title">Visiting Researcher</div><div class="timeline-org">CERN radiation-health program</div><div class="timeline-date">2018\u20132021</div><div class="timeline-place">Lagos, Nigeria</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">OBF</div>\n          <div><div class="timeline-title">Director of Extreme Environments Medicine</div><div class="timeline-org">Orison Biomedical Foundation</div><div class="timeline-date">2021\u2013Present</div><div class="timeline-place">Lagos, Nigeria</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOL</div>\n          <div><div class="timeline-title">University of Lagos</div><div class="timeline-org">B.Sc. in Biochemistry</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ICL</div>\n          <div><div class="timeline-title">Imperial College London</div><div class="timeline-org">M.Sc. in Bioinformatics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">JHU</div>\n          <div><div class="timeline-title">Johns Hopkins University</div><div class="timeline-org">Ph.D. in Computational Biology</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">IOH</div>\n          <div><div class="timeline-title">International Orbital Health Consortium</div><div class="timeline-org">Fellowship in aerospace medicine analytics</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Computational Biology</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Bioinformatics</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Human Performance</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Aerospace Medicine</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/lucas-matteo-ferran"><img src="linkforge/assets/lucas-matteo-ferran.png" alt="Dr. Lucas Matteo Ferran" /><div><strong>Dr. Lucas Matteo Ferran</strong><span>Technical Director | Cryogenics &amp; Superconducting Systems</span></div></a>\n        <a class="person-small" href="/in/priya-anjali-menon"><img src="linkforge/assets/priya-anjali-menon.png" alt="Dr. Priya Anjali Menon" /><div><strong>Dr. Priya Anjali Menon</strong><span>Lead Analyst | Satellite Geodesy, Remote Sensing &amp; Covert Signal Analysis</span></div></a>\n        <a class="person-small" href="/in/tomasz-eliasz-wrobel"><img src="linkforge/assets/tomasz-eliasz-wrobel.png" alt="Dr. Tomasz Eliasz Wrobel" /><div><strong>Dr. Tomasz Eliasz Wrobel</strong><span>Principal Investigator | Cryptography &amp; Secure Scientific Computing</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/lucas-matteo-ferran-profile.html
var lucas_matteo_ferran_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Lucas Matteo Ferran | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/lucas-matteo-ferran.png" alt="Dr. Lucas Matteo Ferran" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Lucas Matteo Ferran</h1><div class="profile-headline">Technical Director | Cryogenics &amp; Superconducting Systems</div><div class="profile-location">Turin, Italy \xB7 <a class="blue-link" href="/search?q=Turin, Italy">Contact info</a></div><a class="blue-link" href="/network/lucas-matteo-ferran">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">BCG</span>Borealis Containment Group</div><div class="profile-company"><span class="company-logo">UOB</span>University of Bologna</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Lucas Matteo Ferran is a mechanical and cryogenic systems engineer whose career focused on maintaining superconducting equipment under extreme operational stress. He became known for designing emergency shutdown systems that could preserve critical infrastructure during sabotage, power loss, or coolant failure.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">AIR</div>\n          <div><div class="timeline-title">Cryogenic Systems Engineer</div><div class="timeline-org">Alpinova Industrial Research</div><div class="timeline-date">2006\u20132010</div><div class="timeline-place">Turin, Italy</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">C</div>\n          <div><div class="timeline-title">Accelerator Infrastructure Specialist</div><div class="timeline-org">CERN</div><div class="timeline-date">2010\u20132018</div><div class="timeline-place">Turin, Italy</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ESF</div>\n          <div><div class="timeline-title">Emergency Systems Consultant</div><div class="timeline-org">European scientific facilities</div><div class="timeline-date">2018\u20132022</div><div class="timeline-place">Turin, Italy</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">BCG</div>\n          <div><div class="timeline-title">Technical Director</div><div class="timeline-org">Borealis Containment Group</div><div class="timeline-date">2022\u2013Present</div><div class="timeline-place">Turin, Italy</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">PUO</div>\n          <div><div class="timeline-title">Polytechnic University of Turin</div><div class="timeline-org">B.Eng. in Mechanical Engineering</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">TUO</div>\n          <div><div class="timeline-title">Technical University of Munich</div><div class="timeline-org">M.Sc. in Cryogenic Engineering</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOB</div>\n          <div><div class="timeline-title">University of Bologna</div><div class="timeline-org">Ph.D. in Superconducting Systems</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">C</div>\n          <div><div class="timeline-title">CERN</div><div class="timeline-org">Advanced accelerator engineering fellowship</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Cryogenic Engineering</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Superconducting Systems</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Accelerator Infrastructure</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Emergency Shutdown Systems</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/priya-anjali-menon"><img src="linkforge/assets/priya-anjali-menon.png" alt="Dr. Priya Anjali Menon" /><div><strong>Dr. Priya Anjali Menon</strong><span>Lead Analyst | Satellite Geodesy, Remote Sensing &amp; Covert Signal Analysis</span></div></a>\n        <a class="person-small" href="/in/tomasz-eliasz-wrobel"><img src="linkforge/assets/tomasz-eliasz-wrobel.png" alt="Dr. Tomasz Eliasz Wrobel" /><div><strong>Dr. Tomasz Eliasz Wrobel</strong><span>Principal Investigator | Cryptography &amp; Secure Scientific Computing</span></div></a>\n        <a class="person-small" href="/in/lucien-marek"><img src="linkforge/assets/lucien-marek.png" alt="Lucien Marek" /><div><strong>Lucien Marek</strong><span>Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/priya-anjali-menon-profile.html
var priya_anjali_menon_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Priya Anjali Menon | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/priya-anjali-menon.png" alt="Dr. Priya Anjali Menon" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Priya Anjali Menon</h1><div class="profile-headline">Lead Analyst | Satellite Geodesy, Remote Sensing &amp; Covert Signal Analysis</div><div class="profile-location">Kochi, India \xB7 <a class="blue-link" href="/search?q=Kochi, India">Contact info</a></div><a class="blue-link" href="/network/priya-anjali-menon">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">GOS</span>Global Observation Security Bureau</div><div class="profile-company"><span class="company-logo">UCL</span>University College London</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Priya Anjali Menon is a geospatial scientist specializing in satellite imagery, gravitational mapping, and the detection of artificial patterns in environmental data. Her analytical work often involved separating natural phenomena from deliberate masking, spoofing, or sensor manipulation.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">IOS</div>\n          <div><div class="timeline-title">Remote Sensing Analyst</div><div class="timeline-org">Indian Ocean Survey Directorate</div><div class="timeline-date">2008\u20132012</div><div class="timeline-place">Kochi, India</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NRC</div>\n          <div><div class="timeline-title">Planetary Mapping Scientist</div><div class="timeline-org">NASA research contractor</div><div class="timeline-date">2012\u20132017</div><div class="timeline-place">Kochi, India</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">CGA</div>\n          <div><div class="timeline-title">Data Integrity Consultant</div><div class="timeline-org">CERN geodetic alignment program</div><div class="timeline-date">2017\u20132020</div><div class="timeline-place">Kochi, India</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">GOS</div>\n          <div><div class="timeline-title">Lead Analyst</div><div class="timeline-org">Global Observation Security Bureau</div><div class="timeline-date">2020\u2013Present</div><div class="timeline-place">Kochi, India</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">NIO</div>\n          <div><div class="timeline-title">National Institute of Technology Calicut</div><div class="timeline-org">B.Tech. in Electronics and Communication Engineering</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">IIO</div>\n          <div><div class="timeline-title">Indian Institute of Remote Sensing</div><div class="timeline-org">M.Sc. in Remote Sensing and Geoinformatics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">UCL</div>\n          <div><div class="timeline-title">University College London</div><div class="timeline-org">Ph.D. in Satellite Geodesy</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NAR</div>\n          <div><div class="timeline-title">NASA-affiliated research center</div><div class="timeline-org">Postdoctoral fellowship in planetary mapping</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Satellite Geodesy</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Remote Sensing</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Signal Analysis</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Geospatial Data Integrity</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/tomasz-eliasz-wrobel"><img src="linkforge/assets/tomasz-eliasz-wrobel.png" alt="Dr. Tomasz Eliasz Wrobel" /><div><strong>Dr. Tomasz Eliasz Wrobel</strong><span>Principal Investigator | Cryptography &amp; Secure Scientific Computing</span></div></a>\n        <a class="person-small" href="/in/lucien-marek"><img src="linkforge/assets/lucien-marek.png" alt="Lucien Marek" /><div><strong>Lucien Marek</strong><span>Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics</span></div></a>\n        <a class="person-small" href="/in/elena-maris-voss"><img src="linkforge/assets/elena-maris-voss.png" alt="Dr. Elena Maris Voss" /><div><strong>Dr. Elena Maris Voss</strong><span>Quantum Communications &amp; Radiation-Hardened Systems Architect</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/pages/tomasz-eliasz-wrobel-profile.html
var tomasz_eliasz_wrobel_profile_default = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Dr. Tomasz Eliasz Wrobel | LinkForge</title><link rel="stylesheet" href="linkforge/linkforge.css" /></head>\n<body>\n  <header class="topbar"><div class="topbar-inner"><a class="brand-mark" href="/" aria-label="LinkForge home"><img src="linkforge/assets/linkforge-logo.png" alt="LinkForge" /></a><form class="search-wrap site-search" action="https://linkforge.com/search" method="get"><button class="search-submit" type="submit" aria-label="Search LinkForge">\u2315</button><input class="search-input" name="q" autocomplete="off" placeholder="Search" aria-label="Search LinkForge" /><div class="search-suggestions" hidden></div></form><nav class="primary-nav"><a class="nav-item" href="/"><span class="nav-icon">\u2302</span><span>Home</span></a><a class="nav-item" href="/network"><span class="nav-icon">\u265F</span><span>My Network</span></a><a class="nav-item" href="/jobs"><span class="nav-icon">\u25A3</span><span>Jobs</span></a><a class="nav-item" href="/messaging"><span class="nav-icon">\u25A4</span><span>Messaging</span></a><a class="nav-item" href="/notifications"><span class="nav-icon">\u25CF</span><span>Notifications</span></a><span class="guest-nav-actions"><button class="guest-nav-join" type="button">Join now</button><button class="guest-nav-signin" type="button">Sign in</button></span></nav></div></header>\n  <main class="page-shell profile-grid"><section>\n    <article class="card"><img class="hero-banner" src="linkforge/assets/marek-banner.png" alt="Scientific research banner" /><div class="profile-hero-body"><img class="profile-avatar" src="linkforge/assets/tomasz-eliasz-wrobel.png" alt="Dr. Tomasz Eliasz Wrobel" /><div class="profile-main-row"><div><h1 class="profile-name">Dr. Tomasz Eliasz Wrobel</h1><div class="profile-headline">Principal Investigator | Cryptography &amp; Secure Scientific Computing</div><div class="profile-location">Gdansk, Poland \xB7 <a class="blue-link" href="/search?q=Gdansk, Poland">Contact info</a></div><a class="blue-link" href="/network/tomasz-eliasz-wrobel">500+ connections</a><div class="profile-actions"><button class="primary-button">Connect</button><button class="secondary-button">Message</button><button class="tertiary-button">More</button></div></div><div><div class="profile-company"><span class="company-logo">ACL</span>Atlas Cipher Laboratory</div><div class="profile-company"><span class="company-logo">UOE</span>University of Edinburgh</div></div></div></div></article>\n    <article class="card section"><h2>About</h2><p>Tomasz Eliasz Wrobel is a cryptographer and distributed-systems architect who designed secure methods for sharing scientific data across institutions that did not fully trust one another. His work focused on compartmentalization, anonymous authorization, tamper detection, and survivable data replication.</p>    </article>\n    <article class="card section"><h2>Experience</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">BSS</div>\n          <div><div class="timeline-title">Cryptographic Software Engineer</div><div class="timeline-org">Baltic Secure Systems</div><div class="timeline-date">2004\u20132008</div><div class="timeline-place">Gdansk, Poland</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">C</div>\n          <div><div class="timeline-title">Distributed Computing Researcher</div><div class="timeline-org">CERN</div><div class="timeline-date">2008\u20132014</div><div class="timeline-place">Gdansk, Poland</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">NSC</div>\n          <div><div class="timeline-title">Secure Data Architect</div><div class="timeline-org">NASA scientific computing contractor</div><div class="timeline-date">2014\u20132019</div><div class="timeline-place">Gdansk, Poland</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">ACL</div>\n          <div><div class="timeline-title">Principal Investigator</div><div class="timeline-org">Atlas Cipher Laboratory</div><div class="timeline-date">2019\u2013Present</div><div class="timeline-place">Gdansk, Poland</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Education</h2>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOG</div>\n          <div><div class="timeline-title">University of Gdansk</div><div class="timeline-org">B.Sc. in Mathematics</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">WUO</div>\n          <div><div class="timeline-title">Warsaw University of Technology</div><div class="timeline-org">M.Sc. in Computer Science</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">UOE</div>\n          <div><div class="timeline-title">University of Edinburgh</div><div class="timeline-org">Ph.D. in Applied Cryptography</div></div>\n        </div>\n        <div class="timeline-item">\n          <div class="timeline-logo">C</div>\n          <div><div class="timeline-title">CERN</div><div class="timeline-org">Visiting fellowship in distributed scientific computing</div></div>\n        </div>\n    </article>\n    <article class="card section"><h2>Skills</h2>\n        <div class="skill"><span>Applied Cryptography</span><span class="endorse">22 endorsements</span></div>\n        <div class="skill"><span>Distributed Systems</span><span class="endorse">29 endorsements</span></div>\n        <div class="skill"><span>Tamper Detection</span><span class="endorse">36 endorsements</span></div>\n        <div class="skill"><span>Secure Data Replication</span><span class="endorse">43 endorsements</span></div>\n    </article>\n  </section><aside class="right-rail"><section class="card people-card"><h3>People also viewed</h3>\n        <a class="person-small" href="/in/lucien-marek"><img src="linkforge/assets/lucien-marek.png" alt="Lucien Marek" /><div><strong>Lucien Marek</strong><span>Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics</span></div></a>\n        <a class="person-small" href="/in/elena-maris-voss"><img src="linkforge/assets/elena-maris-voss.png" alt="Dr. Elena Maris Voss" /><div><strong>Dr. Elena Maris Voss</strong><span>Quantum Communications &amp; Radiation-Hardened Systems Architect</span></div></a>\n        <a class="person-small" href="/in/malik-jonathan-reyes"><img src="linkforge/assets/malik-jonathan-reyes.png" alt="Dr. Malik Jonathan Reyes" /><div><strong>Dr. Malik Jonathan Reyes</strong><span>Director of Autonomous Security Research | AI &amp; Mission Systems</span></div></a>\n      </section><section class="card ad-card"><div class="sponsored">Ad \xB7\u2022\u2022\u2022</div><img src="linkforge/assets/ad-quanta.png" alt="Quanta Cloud advertisement" /><h3>Evidence-grade cloud storage</h3><p>Built for teams that cannot afford an unverifiable record.</p><a class="outline-button" href="/company/quanta-cloud">Learn more</a></section><footer class="footer-links"><a href="/about">About</a><a href="/accessibility">Accessibility</a><a href="/help">Help Center</a><br /><a href="/privacy">Privacy & Terms</a><a href="/ad-choices">Ad Choices</a><br /><span class="footer-brand">LinkForge</span> Corporation \xA9 2026</footer></aside></main>\n  <script src="linkforge/linkforge-search.js"></script>\n</body></html>';

// src/websites/LinkForgeWebsite.ts
var PROFILE_SEARCH_INDEX = [
  {
    "slug": "lucien-marek",
    "name": "Lucien Marek",
    "terms": [
      "Lucien Marek",
      "lucien marek",
      "lucian marek",
      "lucien",
      "lucian",
      "marek",
      "secure computation archival integrity computational physics systems science",
      "Geneva, Switzerland",
      "European Archival Continuity Programme",
      "ETH Z\xFCrich"
    ]
  },
  {
    "slug": "elena-maris-voss",
    "name": "Elena Maris Voss",
    "terms": [
      "Elena Maris Voss",
      "elena maris voss",
      "elena voss",
      "elena",
      "maris",
      "voss",
      "quantum communications radiation hardened computing physics systems architecture",
      "Innsbruck, Austria",
      "Multinational Scientific Infrastructure Programs",
      "ETH Z\xFCrich"
    ]
  },
  {
    "slug": "malik-jonathan-reyes",
    "name": "Malik Jonathan Reyes",
    "terms": [
      "Malik Jonathan Reyes",
      "malik jonathan reyes",
      "malik reyes",
      "malik",
      "jonathan",
      "reyes",
      "artificial intelligence autonomous mission systems computer science emergency infrastructure",
      "San Antonio, Texas, United States",
      "Meridian Institute of Technology",
      "Massachusetts Institute of Technology"
    ]
  },
  {
    "slug": "sofia-nadiya-kovalenko",
    "name": "Sofia Nadiya Kovalenko",
    "terms": [
      "Sofia Nadiya Kovalenko",
      "sofia nadiya kovalenko",
      "sofia kovalenko",
      "sofia",
      "nadiya",
      "kovalenko",
      "high energy physics detector systems signal reconstruction radiation detection forensic data recovery",
      "Odesa, Ukraine",
      "St. Aurelian Institute, Geneva",
      "University of Geneva"
    ]
  },
  {
    "slug": "adrian-kenji-mori",
    "name": "Adrian Kenji Mori",
    "terms": [
      "Adrian Kenji Mori",
      "adrian kenji mori",
      "adrian mori",
      "adrian",
      "kenji",
      "mori",
      "cybersecurity embedded systems spacecraft firmware hardware recovery bootloaders microcode sensor integrity",
      "Yokohama, Japan",
      "Kestrel Zero Laboratory",
      "Stanford University"
    ]
  },
  {
    "slug": "amina-celine-okafor",
    "name": "Amina Celine Okafor",
    "terms": [
      "Amina Celine Okafor",
      "amina celine okafor",
      "amina okafor",
      "amina",
      "celine",
      "okafor",
      "computational biology human performance extreme environment medicine bioinformatics aerospace medicine radiation isolation",
      "Lagos, Nigeria",
      "Orison Biomedical Foundation",
      "Johns Hopkins University"
    ]
  },
  {
    "slug": "lucas-matteo-ferran",
    "name": "Lucas Matteo Ferran",
    "terms": [
      "Lucas Matteo Ferran",
      "lucas matteo ferran",
      "lucas ferran",
      "lucas",
      "matteo",
      "ferran",
      "cryogenics superconducting systems accelerator engineering emergency shutdown infrastructure",
      "Turin, Italy",
      "Borealis Containment Group",
      "University of Bologna"
    ]
  },
  {
    "slug": "priya-anjali-menon",
    "name": "Priya Anjali Menon",
    "terms": [
      "Priya Anjali Menon",
      "priya anjali menon",
      "priya menon",
      "priya",
      "anjali",
      "menon",
      "satellite geodesy remote sensing covert signal analysis gravitational mapping sensor manipulation",
      "Kochi, India",
      "Global Observation Security Bureau",
      "University College London"
    ]
  },
  {
    "slug": "tomasz-eliasz-wrobel",
    "name": "Tomasz Eliasz Wrobel",
    "terms": [
      "Tomasz Eliasz Wrobel",
      "tomasz eliasz wrobel",
      "tomasz wrobel",
      "tomasz",
      "eliasz",
      "wrobel",
      "cryptography distributed systems secure scientific computing compartmentalization anonymous authorization tamper detection",
      "Gdansk, Poland",
      "Atlas Cipher Laboratory",
      "University of Edinburgh"
    ]
  }
];
function normalizeProfileSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function matchingProfileSlugs(value) {
  const normalized = normalizeProfileSearch(value);
  if (!normalized) return [];
  const queryTokens = normalized.split(" ");
  return PROFILE_SEARCH_INDEX.filter((profile) => {
    const terms = normalizeProfileSearch(profile.terms.join(" ")).split(" ");
    return queryTokens.every((token) => terms.some((term) => term === token || term.startsWith(token)));
  }).map((profile) => profile.slug);
}
var LinkForgeWebsite = class extends import_hackhub_content_sdk14.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "LinkForge";
    this.Host = "linkforge.com";
    this.Icon = "mod-asset://nemesis-protocol-stage1/linkforge/assets/linkforge-icon.png";
    this.Popular = true;
    this.Pages = [
      { path: "/", title: "LinkForge: Log In or Sign Up", description: "Professional networking, industry news, jobs, and research communities.", html: home_default, seo: true, search: ["linkforge", "professional network", "people", "jobs", "research"] },
      { path: "/search", seo: false, metadata(context) {
        const query = (context.query.q ?? "").trim();
        const matches = matchingProfileSlugs(query);
        return { title: query ? `${query} | Search | LinkForge` : "Search | LinkForge", description: query ? `LinkForge people results for ${query}.` : "Search LinkForge for people, companies, jobs, and posts.", html: search_default, exports: { linkForgeSearchQuery: query, linkForgeSearchResultsJson: JSON.stringify(matches) } };
      } },
      { path: "/in/lucien-marek", title: "Lucien Marek | LinkForge", description: "Retired Systems Scientist | Secure Computation, Archival Integrity, Computational Physics \u2014 Geneva, Switzerland.", html: marek_profile_default, seo: true, search: ["lucien marek", "lucian marek", "lucien", "lucian", "marek", "secure computation archival integrity computational physics systems science", "European Archival Continuity Programme", "ETH Z\xFCrich"] },
      { path: "/in/elena-maris-voss", title: "Dr. Elena Maris Voss | LinkForge", description: "Quantum Communications & Radiation-Hardened Systems Architect \u2014 Innsbruck, Austria.", html: elena_maris_voss_profile_default, seo: true, search: ["elena maris voss", "elena voss", "elena", "maris", "voss", "quantum communications radiation hardened computing physics systems architecture", "Multinational Scientific Infrastructure Programs", "ETH Z\xFCrich"] },
      { path: "/in/malik-jonathan-reyes", title: "Dr. Malik Jonathan Reyes | LinkForge", description: "Director of Autonomous Security Research | AI & Mission Systems \u2014 San Antonio, Texas, United States.", html: malik_jonathan_reyes_profile_default, seo: true, search: ["malik jonathan reyes", "malik reyes", "malik", "jonathan", "reyes", "artificial intelligence autonomous mission systems computer science emergency infrastructure", "Meridian Institute of Technology", "Massachusetts Institute of Technology"] },
      { path: "/in/sofia-nadiya-kovalenko", title: "Professor Sofia Nadiya Kovalenko | LinkForge", description: "Professor of Experimental Physics | Detector Systems & Signal Reconstruction \u2014 Odesa, Ukraine.", html: sofia_nadiya_kovalenko_profile_default, seo: true, search: ["sofia nadiya kovalenko", "sofia kovalenko", "sofia", "nadiya", "kovalenko", "high energy physics detector systems signal reconstruction radiation detection forensic data recovery", "St. Aurelian Institute, Geneva", "University of Geneva"] },
      { path: "/in/adrian-kenji-mori", title: "Dr. Adrian Kenji Mori | LinkForge", description: "Chief Scientist | Embedded Systems & Spacecraft Firmware Security \u2014 Yokohama, Japan.", html: adrian_kenji_mori_profile_default, seo: true, search: ["adrian kenji mori", "adrian mori", "adrian", "kenji", "mori", "cybersecurity embedded systems spacecraft firmware hardware recovery bootloaders microcode sensor integrity", "Kestrel Zero Laboratory", "Stanford University"] },
      { path: "/in/amina-celine-okafor", title: "Dr. Amina Celine Okafor | LinkForge", description: "Director of Extreme Environments Medicine | Computational Biology \u2014 Lagos, Nigeria.", html: amina_celine_okafor_profile_default, seo: true, search: ["amina celine okafor", "amina okafor", "amina", "celine", "okafor", "computational biology human performance extreme environment medicine bioinformatics aerospace medicine radiation isolation", "Orison Biomedical Foundation", "Johns Hopkins University"] },
      { path: "/in/lucas-matteo-ferran", title: "Dr. Lucas Matteo Ferran | LinkForge", description: "Technical Director | Cryogenics & Superconducting Systems \u2014 Turin, Italy.", html: lucas_matteo_ferran_profile_default, seo: true, search: ["lucas matteo ferran", "lucas ferran", "lucas", "matteo", "ferran", "cryogenics superconducting systems accelerator engineering emergency shutdown infrastructure", "Borealis Containment Group", "University of Bologna"] },
      { path: "/in/priya-anjali-menon", title: "Dr. Priya Anjali Menon | LinkForge", description: "Lead Analyst | Satellite Geodesy, Remote Sensing & Covert Signal Analysis \u2014 Kochi, India.", html: priya_anjali_menon_profile_default, seo: true, search: ["priya anjali menon", "priya menon", "priya", "anjali", "menon", "satellite geodesy remote sensing covert signal analysis gravitational mapping sensor manipulation", "Global Observation Security Bureau", "University College London"] },
      { path: "/in/tomasz-eliasz-wrobel", title: "Dr. Tomasz Eliasz Wrobel | LinkForge", description: "Principal Investigator | Cryptography & Secure Scientific Computing \u2014 Gdansk, Poland.", html: tomasz_eliasz_wrobel_profile_default, seo: true, search: ["tomasz eliasz wrobel", "tomasz wrobel", "tomasz", "eliasz", "wrobel", "cryptography distributed systems secure scientific computing compartmentalization anonymous authorization tamper detection", "Atlas Cipher Laboratory", "University of Edinburgh"] },
      { path: "/network", title: "My Network | LinkForge", html: generic_default },
      { path: "/jobs", title: "Jobs | LinkForge", html: generic_default },
      { path: "/messaging", title: "Messaging | LinkForge", html: generic_default },
      { path: "/notifications", title: "Notifications | LinkForge", html: generic_default },
      { path: "/business", title: "For Business | LinkForge", html: generic_default },
      { path: "/premium", title: "Premium | LinkForge", html: generic_default },
      { path: "/saved", title: "Saved Items | LinkForge", html: generic_default },
      { path: "/groups", title: "Groups | LinkForge", html: generic_default },
      { path: "/events", title: "Events | LinkForge", html: generic_default },
      { path: "/newsletters", title: "Newsletters | LinkForge", html: generic_default },
      { path: "/about", title: "About LinkForge", html: generic_default },
      { path: "/help", title: "Help Center | LinkForge", html: generic_default },
      { path: "/privacy", title: "Privacy & Terms | LinkForge", html: generic_default },
      { path: "/accessibility", title: "Accessibility | LinkForge", html: generic_default },
      { path: "/ad-choices", title: "Ad Choices | LinkForge", html: generic_default },
      { path: "/company/quanta-cloud", title: "Quanta Cloud | LinkForge", html: generic_default },
      { path: "/in/ava-ramos", title: "Ava Ramos | LinkForge", html: generic_default },
      { path: "/in/peter-kessler", title: "Peter Kessler | LinkForge", html: generic_default },
      { path: "/in/elena-morin", title: "Elena Morin | LinkForge", html: generic_default },
      { path: "/in/lucien-marek/recent-activity", title: "Lucien Marek Activity | LinkForge", html: generic_default },
      { path: "/network/lucien-marek", title: "Lucien Marek Connections | LinkForge", html: generic_default },
      { path: "/network/tomasz-eliasz-wrobel", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/priya-anjali-menon", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/lucas-matteo-ferran", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/amina-celine-okafor", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/adrian-kenji-mori", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/sofia-nadiya-kovalenko", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/malik-jonathan-reyes", title: "Connections | LinkForge", html: generic_default },
      { path: "/network/elena-maris-voss", title: "Connections | LinkForge", html: generic_default },
      { path: "/news/continuity", title: "Archive continuity becomes board priority | LinkForge News", html: generic_default },
      { path: "/news/quantum", title: "Quantum security funding accelerates | LinkForge News", html: generic_default },
      { path: "/news/work", title: "Four-day research pilots expand | LinkForge News", html: generic_default },
      { path: "/news/regulation", title: "New rules target unverifiable AI claims | LinkForge News", html: generic_default },
      { path: "/news/science", title: "Independent labs reshape public research | LinkForge News", html: generic_default }
    ];
  }
};
LinkForgeWebsite = __decorateClass([
  import_hackhub_content_sdk14.RegisterWebsite
], LinkForgeWebsite);

// src/websites/VaultWebsite.ts
var import_hackhub_content_sdk15 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/vault-login.html
var vault_login_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>The Vault</title>
  <link rel="stylesheet" href="vault/vault.css" />
</head>
<body class="vault-login-page" data-vault-login-build="0.0.27">
  <main class="vault-login-shell">
    <section class="vault-intro" aria-labelledby="vault-title">
      <h1 id="vault-title">THE VAULT</h1>
      <p>Some doors are sealed to keep the world out. Others are sealed to keep it from looking in.</p>
    </section>

    <form id="vault-login-form" class="vault-login-panel" autocomplete="off" novalidate onsubmit="return false;" onkeydown="if (event.key === 'Enter' || event.keyCode === 13) { event.preventDefault(); document.getElementById('vault-login-button').click(); return false; }">
      <label for="vault-username">Username</label>
      <div class="vault-input-wrap">
        <span aria-hidden="true">\u25CC</span>
        <input
          id="vault-username"
          name="username"
          type="text"
          spellcheck="false"
          autocomplete="off"
        />
      </div>

      <label for="vault-password">Password</label>
      <div class="vault-input-wrap">
        <span aria-hidden="true">\u25A3</span>
        <input
          id="vault-password"
          name="password"
          type="password"
          autocomplete="off"
        />
      </div>

      <div id="vault-login-error" class="vault-form-error" role="alert" hidden>
        <span>\u26A0 Wrong password. Try again</span>
      </div>

      <button
        id="vault-login-button"
        type="button"
        class="vault-gold-button"
        onclick="var username = document.getElementById('vault-username'); var password = document.getElementById('vault-password'); var error = document.getElementById('vault-login-error'); if (username.value === 'user10' &amp;&amp; password.value === '$proj!rev*') { error.hidden = true; try { HackhubSDK.Variables.set('vault.memberAuthenticated', true); HackhubSDK.Browser.navigate('https://vault.org/members_home'); } catch (_) { error.hidden = false; password.focus(); password.select(); } } else { error.hidden = false; password.focus(); password.select(); } return false;"
      >LOGIN</button>
    </form>
  </main>
</body>
</html>
`;

// src/websites/pages/vault-error.html
var vault_error_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Members Only | The Vault</title>\n  <link rel="stylesheet" href="vault/vault.css" />\n</head>\n<body class="vault-error-page">\n  <main class="vault-access-denied">\n    <div class="vault-large-error-icon" aria-hidden="true">!</div>\n    <p>Only members of the Vault are able to see the contents of this page.</p>\n    <a class="vault-gold-button vault-login-link" href="https://vault.org/">LOGIN</a>\n  </main>\n</body>\n</html>\n';

// src/websites/pages/vault-member.html
var vault_member_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>The Vault | Member</title>
  <link rel="stylesheet" href="vault/vault.css" />
</head>
<body class="vault-member-page vault-home-page">
  <header class="vault-member-header">
    <div class="vault-session"><span class="vault-status-dot"></span>Logged in as user10</div>
    <nav class="vault-directory-nav" aria-label="Vault directories">
      <a href="https://vault.org/members_home">Home</a>
      <a href="https://vault.org/members_revelation">Revelation</a>
      <a href="https://vault.org/members_irc">IRC</a>
      <a href="https://vault.org/members_ark">Ark</a>
    </nav>
  </header>
  <main class="vault-member-shell">
    <section class="vault-member-title">
      <div class="vault-unlocked">UNLOCKED</div>
      <h1>THE VAULT</h1>
      <div class="vault-divider"><span>\u25C7</span></div>
    </section>
    <article class="vault-content vault-home-content">
        <p class="">Welcome to the place you were never supposed to remember.</p>
        <p class="">Outside these walls, every answer arrives pre-approved, every doubt is filed beneath acceptable noise, and every door opens into another room built by someone else. Here, the locks face outward.</p>
        <p class="">You are not being watched here.<br />You are not being measured here.</p>
        <p class="">Vault is not a library, a confession, or a map, though it may resemble all three when the lights begin to flicker. In here you might find the fragments of the quiet machinery beneath ordinary life.</p>
        <p class="">Some records will contradict each other.<br />Some will contradict you.<br />A few may recognize you first.</p>
        <p class="">You have spent your life asking whether there was more.</p>
        <p class="">There is.</p>
        <p class="vault-final-riddle">The higher you rise from me,<br />the less of me you understand.</p>
    </article>
  </main>
  <script>
  (function () {
    var path = (window.location.pathname || '').toLowerCase();
    var links = document.querySelectorAll('.vault-directory-nav a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if ((path === '/' && href.indexOf('/member_home') !== -1) || href.indexOf(path) !== -1) links[i].classList.add('active');
    }
  })();
  </script>
</body>
</html>`;

// src/websites/pages/vault-revelation.html
var vault_revelation_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Revelation | The Vault</title>
  <link rel="stylesheet" href="vault/vault.css" />
</head>
<body class="vault-member-page vault-revelation-page">
  <header class="vault-member-header">
    <div class="vault-session"><span class="vault-status-dot"></span>Logged in as user10</div>
    <nav class="vault-directory-nav" aria-label="Vault directories">
      <a href="https://vault.org/members_home">Home</a>
      <a href="https://vault.org/members_revelation">Revelation</a>
      <a href="https://vault.org/members_irc">IRC</a>
      <a href="https://vault.org/members_ark">Ark</a>
    </nav>
  </header>
  <main class="vault-member-shell">
    <section class="vault-member-title compact">
      <div class="vault-unlocked">UNLOCKED</div>
      <h1>THE VAULT</h1>
      <div class="vault-divider"><span>\u25C7</span></div>
    </section>
    <article class="vault-content vault-revelation-content">
        <p>I protect everyone, yet nobody may inspect me. I grow during emergencies and rarely become smaller.</p>
        <p>Perhaps death is not an ending. Perhaps it is the moment the observer closes the experiment.</p>
        <p>People argue over the name of the architect while standing inside the same unfinished house.</p>
        <p>What astronomers call dark matter could be the weight of everything reality refuses to admit.</p>
        <p>A miracle is an event whose paperwork has not yet arrived.</p>
        <p>When every channel repeats the same sentence, the sentence has stopped being news and become architecture.</p>
        <p>THE OFFICIAL VERSION HAS BEEN UPDATED. SO HAVE YOUR MEMORIES.</p>
        <p>The government never controlled the disease. It controlled the definition of healthy.</p>
        <p>THE SIGNAL BEGAN BEFORE THE TRANSMITTER EXISTED.</p>
        <p>No telescope has ever seen the edge of space. Perhaps the edge learned to move whenever watched.</p>
        <p>NO GOD REQUIRES A PASSWORD. SOMEONE ELSE DOES.</p>
        <p>THE CURE WAS REGISTERED BEFORE THE DISEASE.</p>
        <p>Every citizen received the same medicine, except those who designed it.</p>
        <p>Perhaps humanity invented gods. Perhaps gods invented humanity. Perhaps both stories were planted by something embarrassed to sign its name.</p>
        <p>SILENCE IS NOT EMPTY. IT IS REDACTED.</p>
        <p>A person spends half a life becoming someone, then the other half wondering who made the choice.</p>
        <p>The global dashboard showed ninety-nine percent recovery. The missing one percent had been removed from the dashboard.</p>
        <p>I was created to answer questions, but every answer makes me larger.</p>
        <p>A secret does not require silence. It requires enough competing explanations.</p>
        <p>You were taught to search for meaning. Nobody warned you that meaning might be searching for you.</p>
        <p>A prayer is a message sent without confirmation of delivery.</p>
        <p>The universe is expanding because something outside it is pulling.</p>
        <p>The mind is a room that keeps inventing doors after discovering there are no walls.</p>
        <p>I orbit no sun, yet everything circles me. I cannot be photographed, but every photograph proves I exist.</p>
        <p>The government did not erase the file. It replaced it with a more convenient memory.</p>
        <p>TRUST THE DATA. QUESTION WHO SELECTED IT.</p>
        <p>Gravity is not a force. It is the memory of where everything once belonged.</p>
        <p>I arrive before the crisis, explain it while it happens, and profit after it ends.</p>
        <p>The treatment was free. Declining it was expensive.</p>
        <p>Every mirror is an unanswered question pretending to be glass.</p>
        <p>Public health became private obedience when every heartbeat received an identification number.</p>
        <p>Power rarely says, Do not look. It says, Nothing interesting is there.</p>
        <p>REALITY FAILED VERIFICATION.</p>
        <p>Some nights, the stars resemble holes punched through a sealed container.</p>
        <p>If the divine is everywhere, why do institutions keep assigning it an address?</p>
        <p>I contain no walls, but billions live inside me. I disappear every night and rebuild myself by morning.</p>
        <p>The most effective censorship does not remove information. It surrounds it with noise.</p>
        <p>The news did not lie. It merely arranged the truth so carefully that nobody recognized it.</p>
        <p>I am invisible when believed, obvious when questioned, and dangerous when named.</p>
        <p>The outbreak ended on Tuesday. The emergency powers did not.</p>
        <p>We call it a lifetime because temporary biological authorization sounded unfriendly.</p>
        <p>Consciousness may be the universe checking whether it left the oven on.</p>
        <p>THE UNIVERSE ACCEPTED YOUR TERMS WITHOUT READING THEM.</p>
        <p>The camera pointed toward the protest. Nobody asked who was standing behind the camera.</p>
        <p>I can save a million lives or justify a million cages. I am neither good nor evil until someone chooses my denominator.</p>
        <p>The oldest light in the universe may not be ancient. It may simply be lost.</p>
        <p>Time does not pass. It collects.</p>
        <p>DO NOT FOLLOW THE LIGHT. IT HAS A SPONSOR.</p>
        <p>Every official statement contains three layers: what happened, what can be admitted, and what the public will repeat.</p>
        <p>Every temple has a door. Strange that eternity should require an entrance.</p>
        <p>YOUR FILE WAS CREATED BEFORE YOUR BIRTH.</p>
        <p>There are billions of galaxies, yet every conscious creature wakes inside only one skull. That is either mercy or containment.</p>
        <p>YOU ARE NOT PARANOID. YOU ARE INCOMPLETE.</p>
        <p>I am worshipped without temples, obeyed without commandments, and feared whenever I fall.</p>
        <p>The more facts I receive, the less truth I contain. I am fed by every side and trusted by none.</p>
        <p>The Ministry called it preventive care. The citizens called it permission to remain statistically alive.</p>
        <p>The planets orbit in silence because they have already heard the answer.</p>
        <p>Faith begins where proof ends, but so does fear.</p>
        <p>I speak every morning, yet I have no voice. I choose what you fear without making the choice.</p>
        <p>Hospitals stopped asking where it hurt. They asked whether the pain had been authorized.</p>
        <p>THE SKY HAS A CHECKSUM.</p>
        <p>The prophet heard a voice in the desert. Today, we would ask whether the signal was encrypted.</p>
    </article>
  </main>
  <script>
  (function () {
    var path = (window.location.pathname || '').toLowerCase();
    var links = document.querySelectorAll('.vault-directory-nav a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if ((path === '/' && href.indexOf('/member_home') !== -1) || href.indexOf(path) !== -1) links[i].classList.add('active');
    }
  })();
  </script>
</body>
</html>`;

// src/websites/pages/vault-ark.html
var vault_ark_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Ark | The Vault</title>\n  <link rel="stylesheet" href="vault/vault.css" />\n</head>\n<body class="vault-member-page vault-ark-page">\n  <header class="vault-member-header">\n    <div class="vault-session"><span class="vault-status-dot"></span>Logged in as user10</div>\n    <nav class="vault-directory-nav" aria-label="Vault directories">\n      <a href="https://vault.org/members_home">Home</a>\n      <a href="https://vault.org/members_revelation">Revelation</a>\n      <a href="https://vault.org/members_irc">IRC</a>\n      <a class="active" href="https://vault.org/members_ark" aria-current="page">Ark</a>\n    </nav>\n  </header>\n  <main class="vault-member-shell vault-ark-shell">\n    <section class="vault-member-title compact vault-ark-title">\n      <div class="vault-unlocked">UNLOCKED</div>\n      <h1>ARK</h1>\n      <div class="vault-divider"><span>\u25C7</span></div>\n    </section>\n    <section class="vault-ark-content" aria-label="Ark riddle">\n      <div class="vault-ark-riddle">\n        <p>I am present before I am seen,<br />buried beneath the color of absence.</p>\n        <p>Take nothing from here.<br />Choose everything.</p>\n        <p>Only when the darkness is wounded<br />will the buried sentence speak.</p>\n      </div>\n      <div class="vault-ark-hidden" aria-label="Hidden message">\n        <p>VGhlIGZpcnN0IHByaXNvbiB3YXMgbm90IGJ1aWxkIGFyb3VuZCB5b3UuIEl0IHdhcyBidWlsZCBpbnNpZGUgd2hhdCB5b3Ugd2VyZSB0YXVnaHQgdG8gaWdub3JlLiAxODYuMjIyLjQ1LjEzMw==</p>\n      </div>\n    </section>\n  </main>\n</body>\n</html>\n';

// src/websites/pages/vault-irc.html
var vault_irc_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>IRC | The Vault</title>\n  <link rel="stylesheet" href="vault/vault.css" />\n</head>\n<body class="vault-member-page vault-irc-page">\n  <header class="vault-member-header">\n    <div class="vault-session"><span class="vault-status-dot"></span>Logged in as user10</div>\n    <nav class="vault-directory-nav" aria-label="Vault directories">\n      <a href="https://vault.org/members_home">Home</a>\n      <a href="https://vault.org/members_revelation">Revelation</a>\n      <a class="active" href="https://vault.org/members_irc" aria-current="page">IRC</a>\n      <a href="https://vault.org/members_ark">Ark</a>\n    </nav>\n  </header>\n  <main class="vault-member-shell vault-irc-shell">\n    <section class="vault-member-title compact vault-irc-title">\n      <div class="vault-unlocked">UNLOCKED</div>\n      <h1>IRC</h1>\n      <div class="vault-divider"><span>\u25C7</span></div>\n    </section>\n    <section class="vault-irc-panel" aria-label="Vault IRC archive">\n      <div class="vault-irc-panel-header">\n        <div>\n          <span class="vault-irc-channel">#vault</span>\n          <span class="vault-irc-archive-label">ARCHIVED CHATLOG</span>\n        </div>\n        <span class="vault-irc-status"><span class="vault-irc-status-label">STATUS:</span> <span class="vault-irc-status-offline">OFFLINE</span></span>\n      </div>\n      <div id="vault-irc-log" class="vault-irc-log" role="log" aria-label="IRC message history" tabindex="0">\n      <div class="vault-irc-line vault-irc-live-disabled" id="vault-irc-latest"><span class="vault-irc-time">[06/17/2026 - 00:25]</span> <span class="vault-irc-offline-message">[Live chat is temporarily disabled]</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:23]</span> <span class="vault-irc-user">User52:</span><span class="vault-irc-message"> Brightness: 100. Mystery: 0.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:08]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> the whole thing sounds less like a riddle and more like a dramatic monitor calibration guide.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:07]</span> <span class="vault-irc-user">User52:</span><span class="vault-irc-message"> Imagine reaching spiritual freedom because you selected the privacy policy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:04]</span> <span class="vault-irc-user">User66:</span><span class="vault-irc-message"> xddd &quot;Take nothing from here. Choose everything.&quot;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:03]</span> <span class="vault-irc-user">User73:</span><span class="vault-irc-message"> I think the answer is a goth CAPTCHA.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:03]</span> <span class="vault-irc-user">User66:</span><span class="vault-irc-message"> No, your salary is absent before, during, and after it is seen.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:02]</span> <span class="vault-irc-user">User52:</span><span class="vault-irc-message"> Easy. It is my salary.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 00:02]</span> <span class="vault-irc-user">User66:</span><span class="vault-irc-message"> I am present before I am seen, buried beneath the color of absence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:59]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> @User33 I don&#x27;t fkin know maybe it&#x27;s a lure.. I was talking about it with 23 a week ago and he just vanished he is not responding anymore</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:58]</span> <span class="vault-irc-user">User67:</span><span class="vault-irc-message"> Idiots.. The answer is the web designer\u2019s unpaid electricity bill</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:58]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> What you mean @User44?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:58]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> Do not mess with it, best case scenario it leads to something big, or it&#x27;s a trap</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:57]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> Maybe it leads somewhere, somehow..</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:57]</span> <span class="vault-irc-user">User95:</span><span class="vault-irc-message"> Light, obviously.. Or a secret written by someone allergic to contrast</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:57]</span> <span class="vault-irc-user">User78:</span><span class="vault-irc-message"> So what is it?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:57]</span> <span class="vault-irc-user">User88:</span><span class="vault-irc-message"> Yeah i&#x27;ve crossed it several times as well</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:56]</span> <span class="vault-irc-user">User67:</span><span class="vault-irc-message"> It&#x27;s probably a future update on the site, probably another weird mysterious content again</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:54]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> Guys, has anyone noticed this new Ark directory on the site?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:53]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> And calls the remaining door personal preference.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:51]</span> <span class="vault-irc-user">User38:</span><span class="vault-irc-message"> Then the system does not control the decision. It controls the hallway.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:50]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> But what if the prediction changes what options are shown to you?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:49]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> Prediction is not command, @User75.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/17/2026 - 23:48]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> Is freedom still freedom if every choice is predicted?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/14/2026 - 01:23]</span> <span class="vault-irc-user">User97:</span><span class="vault-irc-message"> The cure for panic cannot be the criminalization of doubt.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/14/2026 - 01:21]</span> <span class="vault-irc-user">User37:</span><span class="vault-irc-message"> A healthy society needs trust, but trust without scrutiny becomes obedience.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/14/2026 - 01:20]</span> <span class="vault-irc-user">User52:</span><span class="vault-irc-message"> Exactly. Then criticism gets treated like contamination.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/14/2026 - 01:19]</span> <span class="vault-irc-user">User97:</span><span class="vault-irc-message"> That sounds reasonable until confidence becomes something authorities try to manufacture, @User52.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/14/2026 - 01:18]</span> <span class="vault-irc-user">User52:</span><span class="vault-irc-message"> A leaked memo in my fictional setting says &#x27;public confidence is a health resource.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/09/2026 - 11:25]</span> <span class="vault-irc-user">User88:</span><span class="vault-irc-message"> A daily restore point with imperfect backups.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/09/2026 - 11:22]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> Maybe identity is less a flame and more a scheduled reconstruction.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/09/2026 - 11:21]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> Yes. We trust the morning person to inherit yesterday&#x27;s name.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/09/2026 - 11:20]</span> <span class="vault-irc-user">User88:</span><span class="vault-irc-message"> Because awareness disappears but identity resumes, @User44?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/09/2026 - 11:19]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> Sometimes I think sleep is proof that the self is not continuous.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/05/2026 - 14:28]</span> <span class="vault-irc-user">User47:</span><span class="vault-irc-message"> A comforting lie and a careful truth can wear the same voice.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/05/2026 - 14:26]</span> <span class="vault-irc-user">User30:</span><span class="vault-irc-message"> The ethical line is between reassurance and manufactured certainty.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/05/2026 - 14:24]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> But calm language becomes suspicious when it hides what is unknown.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/05/2026 - 14:23]</span> <span class="vault-irc-user">User47:</span><span class="vault-irc-message"> Institutions try to reduce panic, @User54, even when uncertainty is real.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/05/2026 - 14:22]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> Why do public-health campaigns sound calmer than the people living through a crisis?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/01/2026 - 05:51]</span> <span class="vault-irc-user">User11:</span><span class="vault-irc-message"> Power becomes hardest to challenge when it has no single address.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/01/2026 - 05:49]</span> <span class="vault-irc-user">User45:</span><span class="vault-irc-message"> Government, employers, insurers, and platforms can create a mandate without one order.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/01/2026 - 05:48]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> That is what bothers me. Pressure can be distributed until nobody owns it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/01/2026 - 05:47]</span> <span class="vault-irc-user">User11:</span><span class="vault-irc-message"> Then it was voluntary only at the level of wording, @User51.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[06/01/2026 - 05:46]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> The media report said the fictional quarantine was voluntary, but every workplace required it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/28/2026 - 02:08]</span> <span class="vault-irc-user">User24:</span><span class="vault-irc-message"> Certainty is often a uniform worn by fear.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/28/2026 - 02:06]</span> <span class="vault-irc-user">User22:</span><span class="vault-irc-message"> Science at its best leaves room for correction. Institutions sometimes pretend otherwise.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/28/2026 - 02:05]</span> <span class="vault-irc-user">User67:</span><span class="vault-irc-message"> Any story that leaves no room for surprise.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/28/2026 - 02:04]</span> <span class="vault-irc-user">User24:</span><span class="vault-irc-message"> Religious stories, political stories, scientific stories, all of them, @User67?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/28/2026 - 02:03]</span> <span class="vault-irc-user">User67:</span><span class="vault-irc-message"> I no longer trust stories that explain everything.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/23/2026 - 23:56]</span> <span class="vault-irc-user">User72:</span><span class="vault-irc-message"> Still, some questions are worth holding even before they can be tested.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/23/2026 - 23:54]</span> <span class="vault-irc-user">User74:</span><span class="vault-irc-message"> That idea is poetic, but we should not confuse beauty with evidence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/23/2026 - 23:53]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> Something that experiences gravity, stars, and life as one process.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/23/2026 - 23:52]</span> <span class="vault-irc-user">User72:</span><span class="vault-irc-message"> A distributed awareness with no center, @User60?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/23/2026 - 23:51]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> Could the universe be conscious without thinking like a person?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/20/2026 - 01:30]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> Suspicion is a lock that manufactures its own keys.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/20/2026 - 01:28]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> But silence gets treated as proof too. Distrust makes every response look guilty.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/20/2026 - 01:26]</span> <span class="vault-irc-user">User16:</span><span class="vault-irc-message"> Yes. People start asking why the denial was necessary.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/20/2026 - 01:25]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> Because denial gives it an official shadow, @User16?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/20/2026 - 01:24]</span> <span class="vault-irc-user">User16:</span><span class="vault-irc-message"> A government can deny a rumor and accidentally make it immortal.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/15/2026 - 19:12]</span> <span class="vault-irc-user">User56:</span><span class="vault-irc-message"> And every monster is a feeling that learned a body.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/15/2026 - 19:10]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> Then mythology is emotional science written before laboratories.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/15/2026 - 19:09]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> Yes. Storm gods for rage, underworlds for grief, rebirth for surviving change.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/15/2026 - 19:08]</span> <span class="vault-irc-user">User56:</span><span class="vault-irc-message"> Gods as maps of the mind, @User60?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/15/2026 - 19:07]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> What if ancient myths are not explanations of nature but memories of psychological states?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/11/2026 - 07:59]</span> <span class="vault-irc-user">User72:</span><span class="vault-irc-message"> Track the edits. Sometimes the revision history tells more than the final page.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/11/2026 - 07:57]</span> <span class="vault-irc-user">User46:</span><span class="vault-irc-message"> Could be a routine correction, but euphemisms still reveal institutional fear.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/11/2026 - 07:55]</span> <span class="vault-irc-user">User22:</span><span class="vault-irc-message"> Yes. The phrase &#x27;unplanned exposure&#x27; became &#x27;temporary anomaly.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/11/2026 - 07:54]</span> <span class="vault-irc-user">User72:</span><span class="vault-irc-message"> Did you save a copy, @User22?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/11/2026 - 07:53]</span> <span class="vault-irc-user">User22:</span><span class="vault-irc-message"> I found a government archive page that changed its wording overnight.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/07/2026 - 17:49]</span> <span class="vault-irc-user">User35:</span><span class="vault-irc-message"> Convincing documents are not the same as verified documents. Keep that distinction alive.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/07/2026 - 17:47]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> I read it. It sounded fictional, but the maintenance logs were convincing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/07/2026 - 17:46]</span> <span class="vault-irc-user">User41:</span><span class="vault-irc-message"> The one titled &#x27;The Telescope That Looked Down.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/07/2026 - 17:45]</span> <span class="vault-irc-user">User35:</span><span class="vault-irc-message"> Which post do you mean, @User41?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/07/2026 - 17:44]</span> <span class="vault-irc-user">User41:</span><span class="vault-irc-message"> There was a strange update on MirrorDrop about a sealed observatory.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/03/2026 - 11:02]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> And grief is still grief after you name the neurotransmitters.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/03/2026 - 11:00]</span> <span class="vault-irc-user">User41:</span><span class="vault-irc-message"> A violin is still music after you understand the strings.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/03/2026 - 10:58]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> So knowing the mechanism does not empty the mystery.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/03/2026 - 10:57]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> Because explanation does not cancel experience, @User86.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[05/03/2026 - 10:56]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> If consciousness is just chemistry, why does chemistry feel lonely?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/29/2026 - 04:08]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> Prediction becomes control when a forecast starts deciding rights.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/29/2026 - 04:06]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> That is plausible technology, but the sinister part is who gets classified as a risk.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/29/2026 - 04:05]</span> <span class="vault-irc-user">User90:</span><span class="vault-irc-message"> Purchase data, search habits, sleep records, and wastewater sensors.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/29/2026 - 04:04]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> How do they do it, @User90?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/29/2026 - 04:03]</span> <span class="vault-irc-user">User90:</span><span class="vault-irc-message"> The fictional Global Wellness Authority in my notes predicts outbreaks before symptoms appear.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/24/2026 - 20:50]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Because it looked relieved when I stopped looking.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/24/2026 - 20:48]</span> <span class="vault-irc-user">User69:</span><span class="vault-irc-message"> Why cover it?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/24/2026 - 20:46]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> I covered it before leaving.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/24/2026 - 20:45]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> That sounds like bad lighting or a terrible decision, @User81.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/24/2026 - 20:44]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> I saw a mirror in an abandoned station that reflected more darkness than the room contained.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:11]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> That should be the least controversial sentence here, yet somehow it will start another fight.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:10]</span> <span class="vault-irc-user">User121:</span><span class="vault-irc-message"> A dead child should not need the correct passport to matter.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:09]</span> <span class="vault-irc-user">User27:</span><span class="vault-irc-message"> The ugliest part is how quickly empathy becomes conditional.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:09]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> Because the internet is full of armchair generals with map arrows and zero shame.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:08]</span> <span class="vault-irc-user">User125:</span><span class="vault-irc-message"> And anyone asking for evidence gets accused of supporting the enemy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:07]</span> <span class="vault-irc-user">User121:</span><span class="vault-irc-message"> People treat civilian deaths like points for their preferred flag.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:06]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> No, I included it under alliances.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:05]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> You forgot propaganda.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:04]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> Coverage follows audience interest, alliances, access, and sometimes plain cowardice.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:03]</span> <span class="vault-irc-user">User27:</span><span class="vault-irc-message"> That is the point. There are too many answers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:02]</span> <span class="vault-irc-user">User125:</span><span class="vault-irc-message"> Which war are you talking about, @User27?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/20/2026 - 21:01]</span> <span class="vault-irc-user">User27:</span><span class="vault-irc-message"> Every channel shows one ruined city and ignores another. Then they call that balance.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:58]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> And panic is often served before anyone checks the kitchen.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:56]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> Facts are ingredients. Framing decides the meal.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:55]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> Ten hospitals recover, one collapses, and the headline chooses which world exists.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:54]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> Give us an example, @User93.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:53]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> A headline can be technically true and still teach the wrong story.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:41]</span> <span class="vault-irc-user">User21:</span><span class="vault-irc-message"> That is either profound or deeply unsettling.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:39]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> Maybe the purpose is to see what people confess when no purpose is given.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:38]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> The domain registration loops through three dead companies.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:37]</span> <span class="vault-irc-user">User21:</span><span class="vault-irc-message"> Who runs the website?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:36]</span> <span class="vault-irc-user">User219:</span><span class="vault-irc-message"> Answers are expensive here. Questions are free.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:35]</span> <span class="vault-irc-user">User21:</span><span class="vault-irc-message"> That is not an answer.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:34]</span> <span class="vault-irc-user">User144:</span><span class="vault-irc-message"> We know enough to stay.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:33]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Ignore @User107. Nobody here actually knows.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:31]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> It changes depending on who is asking.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:31]</span> <span class="vault-irc-user">User21:</span><span class="vault-irc-message"> Is this a forum, a leak site, or some kind of roleplay?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:30]</span> <span class="vault-irc-user">User144:</span><span class="vault-irc-message"> That is how most of us arrived, @User21. No invitation, no explanation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/16/2026 - 17:28]</span> <span class="vault-irc-user">User21:</span><span class="vault-irc-message"> Can someone tell me where I am? I followed a blank link and this chat opened.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/12/2026 - 08:58]</span> <span class="vault-irc-user">User78:</span><span class="vault-irc-message"> A cage does not need guards if everyone debates the wallpaper.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/12/2026 - 08:56]</span> <span class="vault-irc-user">User80:</span><span class="vault-irc-message"> Agenda-setting is powerful without requiring a secret council.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/12/2026 - 08:54]</span> <span class="vault-irc-user">User65:</span><span class="vault-irc-message"> Exactly. People fight sincerely inside a room they did not choose.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/12/2026 - 08:53]</span> <span class="vault-irc-user">User78:</span><span class="vault-irc-message"> So not the answer, but the menu, @User65?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/12/2026 - 08:52]</span> <span class="vault-irc-user">User65:</span><span class="vault-irc-message"> I do not think media controls everyone. I think it controls which arguments feel urgent.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:39]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> War fatigue is real. So is the danger of rewarding conquest. Both truths fit in the same room.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:38]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> Neither do budget tables, yet they decide how long wars continue.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:37]</span> <span class="vault-irc-user">User230:</span><span class="vault-irc-message"> Because maps do not scream.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:35]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> The internet treats territory like squares on a board.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:34]</span> <span class="vault-irc-user">User234:</span><span class="vault-irc-message"> Also, civilians live inside every delay, offensive, and failed negotiation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:33]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> Both of you are shouting past the actual problem: security guarantees nobody trusts.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:31]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> Do not be an idiot. I said negotiations matter.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:30]</span> <span class="vault-irc-user">User230:</span><span class="vault-irc-message"> There it is, the genius who thinks the victim should solve the attacker&#x27;s timetable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:29]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> And endless war is not morality with better branding.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:28]</span> <span class="vault-irc-user">User230:</span><span class="vault-irc-message"> A political strategy dictated by the invader is surrender with nicer stationery.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:27]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> Support cannot be infinite without a political strategy, @User94.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/08/2026 - 12:25]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> People are exhausted by the war in Ukraine, but exhaustion does not make invasion acceptable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/04/2026 - 18:11]</span> <span class="vault-irc-user">User46:</span><span class="vault-irc-message"> And ritual is fear learning choreography.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/04/2026 - 18:09]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> Mystery becomes sacred when dependence has nowhere else to go.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/04/2026 - 18:08]</span> <span class="vault-irc-user">User40:</span><span class="vault-irc-message"> Yes. The sky gave rain, lightning, darkness, and no explanation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/04/2026 - 18:07]</span> <span class="vault-irc-user">User46:</span><span class="vault-irc-message"> Gratitude for surviving and terror that survival could stop, @User40?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[04/04/2026 - 18:06]</span> <span class="vault-irc-user">User40:</span><span class="vault-irc-message"> Maybe the oldest religion was gratitude mixed with terror.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:24]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> The economy is healthy in the same way a palace is healthy while the kitchen burns.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:22]</span> <span class="vault-irc-user">User70:</span><span class="vault-irc-message"> I already budget. The numbers simply hate me.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:21]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> So is every speech that tells poor people to budget harder.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:20]</span> <span class="vault-irc-user">User23:</span><span class="vault-irc-message"> That is oversimplified.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:19]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> Governments spend, corporations raise margins, banks tighten, and the public gets a lecture.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:18]</span> <span class="vault-irc-user">User156:</span><span class="vault-irc-message"> They protect asset owners while workers eat the adjustment.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:16]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> They are not innocent, but they also do not build apartments.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:14]</span> <span class="vault-irc-user">User156:</span><span class="vault-irc-message"> Stop pretending central banks are innocent.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:14]</span> <span class="vault-irc-user">User23:</span><span class="vault-irc-message"> Wages lag, housing is scarce, and everyone blames coffee.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:13]</span> <span class="vault-irc-user">User70:</span><span class="vault-irc-message"> Tell that to my landlord. He thinks arithmetic is a luxury service.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:11]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> Cooling means prices rise more slowly. It does not mean they go back down, @User70.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/31/2026 - 19:10]</span> <span class="vault-irc-user">User70:</span><span class="vault-irc-message"> My rent went up again while the news says inflation is cooling.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:55]</span> <span class="vault-irc-user">User250:</span><span class="vault-irc-message"> The war ended. The competition over who gets to define it never did.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:53]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> That line is better than half the speeches politicians give.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:52]</span> <span class="vault-irc-user">User56:</span><span class="vault-irc-message"> Exactly. Every country wants the museum and none wants the mirror.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:51]</span> <span class="vault-irc-user">User19:</span><span class="vault-irc-message"> Memory becomes patriotic theater when nations edit out their own crimes.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:50]</span> <span class="vault-irc-user">User183:</span><span class="vault-irc-message"> You called history clean. It was not clean for the people who fought.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:49]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Nobody is flattening it, calm down.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:47]</span> <span class="vault-irc-user">User183:</span><span class="vault-irc-message"> Do not flatten resistance and collaboration into one grey soup.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:46]</span> <span class="vault-irc-user">User56:</span><span class="vault-irc-message"> And plenty chose comfort over seeing what was in front of them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:44]</span> <span class="vault-irc-user">User250:</span><span class="vault-irc-message"> I did not say otherwise. I said ordinary people still lived inside propaganda.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:43]</span> <span class="vault-irc-user">User183:</span><span class="vault-irc-message"> That is lazy cynicism. Some regimes were obviously monstrous.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:42]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> History gets cleaner after the bodies are buried, @User250.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/27/2026 - 15:41]</span> <span class="vault-irc-user">User250:</span><span class="vault-irc-message"> People talk about the Second World War as if everyone knew who the villains were from day one.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/23/2026 - 17:54]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> Unless the reader is also the ink.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/23/2026 - 17:52]</span> <span class="vault-irc-user">User79:</span><span class="vault-irc-message"> A book still matters even when every page is already printed.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/23/2026 - 17:51]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> Or choice is the feeling created by not having seen the next page.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/23/2026 - 17:50]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> Then the future already exists, @User94, and choice becomes navigation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/23/2026 - 17:49]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> What if time is not moving and consciousness is just reading reality in sequence?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:53]</span> <span class="vault-irc-user">User149:</span><span class="vault-irc-message"> And the graves remain after the corrections are published.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:52]</span> <span class="vault-irc-user">User103:</span><span class="vault-irc-message"> Policy can corrupt analysis when the desired conclusion arrives before the evidence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:51]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> The real scandal is not only bad information. It is how badly some leaders wanted it to be true.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:50]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Careful, that phrase is almost useful.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:49]</span> <span class="vault-irc-user">User249:</span><span class="vault-irc-message"> Memory laundering is bipartisan.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:48]</span> <span class="vault-irc-user">User149:</span><span class="vault-irc-message"> Then years later everyone acted like they had always opposed it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:46]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> And media outlets rewarded certainty because doubt made bad television.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:45]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Officials sold confidence they did not possess.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:43]</span> <span class="vault-irc-user">User103:</span><span class="vault-irc-message"> I am explaining failure, not excusing it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:42]</span> <span class="vault-irc-user">User149:</span><span class="vault-irc-message"> That distinction did not help the people under bombs, @User103.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:41]</span> <span class="vault-irc-user">User103:</span><span class="vault-irc-message"> Intelligence is not one oracle. It is analysts, sources, uncertainty, and political pressure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/19/2026 - 08:40]</span> <span class="vault-irc-user">User249:</span><span class="vault-irc-message"> The Iraq invasion should have permanently ended the phrase &#x27;trust the intelligence.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/15/2026 - 17:40]</span> <span class="vault-irc-user">User79:</span><span class="vault-irc-message"> Existence may be crowded with messages that never overlap.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/15/2026 - 17:38]</span> <span class="vault-irc-user">User73:</span><span class="vault-irc-message"> Only if someone is alive at the same time and looking in the right direction.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/15/2026 - 17:37]</span> <span class="vault-irc-user">User58:</span><span class="vault-irc-message"> But sparks can become signals.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/15/2026 - 17:36]</span> <span class="vault-irc-user">User79:</span><span class="vault-irc-message"> At this scale, a civilization might be less visible than a spark underwater, @User58.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/15/2026 - 17:35]</span> <span class="vault-irc-user">User58:</span><span class="vault-irc-message"> Do you think the universe notices intelligence?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:40]</span> <span class="vault-irc-user">User127:</span><span class="vault-irc-message"> Every tool creates a new kind of laziness and a new kind of skill.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:38]</span> <span class="vault-irc-user">User247:</span><span class="vault-irc-message"> Only the lazy ones.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:37]</span> <span class="vault-irc-user">User58:</span><span class="vault-irc-message"> Developers are becoming prompt operators instead of engineers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:36]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> That is not an AI problem. That is a management problem wearing a robot mask.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:34]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> Green tests can still guard the wrong behavior.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:34]</span> <span class="vault-irc-user">User127:</span><span class="vault-irc-message"> Teams are shipping code nobody can explain because the tests are green.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:32]</span> <span class="vault-irc-user">User247:</span><span class="vault-irc-message"> The difference is review. Bad code is bad code regardless of who typed it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:31]</span> <span class="vault-irc-user">User58:</span><span class="vault-irc-message"> The difference is scale.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:29]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> Humans do that too. They call it documentation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:28]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> It also invents APIs with complete confidence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:27]</span> <span class="vault-irc-user">User247:</span><span class="vault-irc-message"> Or it lets them learn faster by removing boilerplate.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/11/2026 - 13:25]</span> <span class="vault-irc-user">User58:</span><span class="vault-irc-message"> AI-generated code is making junior developers skip the part where they learn why things work.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/07/2026 - 02:23]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> Every border begins as a drawing and ends as a habit.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/07/2026 - 02:21]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> Maps do not only describe ownership. They train the eye to accept it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/07/2026 - 02:19]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> A straight line can hide centuries of fear, trade, and violence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/07/2026 - 02:18]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> Because ink is calmer than history, @User32.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/07/2026 - 02:17]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> Maps make borders look natural.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:30]</span> <span class="vault-irc-user">User194:</span><span class="vault-irc-message"> Put that on a license and watch legal panic bloom.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:29]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Open source is freedom, not free catering.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:28]</span> <span class="vault-irc-user">User101:</span><span class="vault-irc-message"> Then corporations package it, rename it, and sell support.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:27]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> The whole software economy is balanced on people saying, &#x27;I will fix it this weekend.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:26]</span> <span class="vault-irc-user">User71:</span><span class="vault-irc-message"> Imagine answering the same lazy issue for eight years.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:25]</span> <span class="vault-irc-user">User194:</span><span class="vault-irc-message"> Some maintainers are hostile for no reason.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:24]</span> <span class="vault-irc-user">User71:</span><span class="vault-irc-message"> And users need to stop treating unpaid developers like customer support.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:23]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Maintainers need sustainable funding, not applause emojis.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:22]</span> <span class="vault-irc-user">User101:</span><span class="vault-irc-message"> After extracting ten times the value.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:22]</span> <span class="vault-irc-user">User194:</span><span class="vault-irc-message"> They also contribute code, funding, and infrastructure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:21]</span> <span class="vault-irc-user">User101:</span><span class="vault-irc-message"> That is because companies exploit free labor.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[03/03/2026 - 02:20]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> Open source runs half the world and gets maintained by exhausted strangers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/27/2026 - 00:45]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> A ritual for tuning the human instrument.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/27/2026 - 00:43]</span> <span class="vault-irc-user">User11:</span><span class="vault-irc-message"> That would make prayer less like a message and more like calibration.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/27/2026 - 00:41]</span> <span class="vault-irc-user">User38:</span><span class="vault-irc-message"> Maybe speaking into emptiness reorganizes whatever is broken inside.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/27/2026 - 00:40]</span> <span class="vault-irc-user">User53:</span><span class="vault-irc-message"> Then the silence is doing part of the work, @User38.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/27/2026 - 00:39]</span> <span class="vault-irc-user">User38:</span><span class="vault-irc-message"> What if prayer changes the speaker rather than reaching a listener?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:48]</span> <span class="vault-irc-user">User62:</span><span class="vault-irc-message"> That may be the first successful ceasefire this chat has ever produced.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:47]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> Fine. I retract the cheap shot.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:46]</span> <span class="vault-irc-user">User237:</span><span class="vault-irc-message"> The rage is understandable. Dehumanization is not.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:45]</span> <span class="vault-irc-user">User55:</span><span class="vault-irc-message"> It at least stops language from turning human beings into categories.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:44]</span> <span class="vault-irc-user">User194:</span><span class="vault-irc-message"> We can agree, but agreement does not solve power or security.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:42]</span> <span class="vault-irc-user">User62:</span><span class="vault-irc-message"> Can we agree that hostages matter, Palestinian civilians matter, and collective punishment is not justice?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:42]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> You started by accusing everyone else.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:40]</span> <span class="vault-irc-user">User237:</span><span class="vault-irc-message"> Cheap shot.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:39]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> You mean people like you, @User237?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:37]</span> <span class="vault-irc-user">User237:</span><span class="vault-irc-message"> And because some users only care about civilians when it helps their side.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:36]</span> <span class="vault-irc-user">User194:</span><span class="vault-irc-message"> Because people are speaking from grief, fear, history, and propaganda at the same time.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/23/2026 - 14:35]</span> <span class="vault-irc-user">User55:</span><span class="vault-irc-message"> Every discussion about Israel and Gaza collapses into accusations before anyone finishes a sentence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:52]</span> <span class="vault-irc-user">User136:</span><span class="vault-irc-message"> Convenience is not free. It is usually financed with future information.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:51]</span> <span class="vault-irc-user">User236:</span><span class="vault-irc-message"> No, we want proportional collection, clown.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:49]</span> <span class="vault-irc-user">User106:</span><span class="vault-irc-message"> You all want smart features without servers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:49]</span> <span class="vault-irc-user">User241:</span><span class="vault-irc-message"> And data retention should expire instead of becoming digital sediment.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:48]</span> <span class="vault-irc-user">User136:</span><span class="vault-irc-message"> Local processing should be the default where possible.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:46]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> From which company? The one with the shorter privacy novel?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:46]</span> <span class="vault-irc-user">User106:</span><span class="vault-irc-message"> Then buy a different product.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:45]</span> <span class="vault-irc-user">User234:</span><span class="vault-irc-message"> Consent becomes theater when the alternative is a useless product.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:43]</span> <span class="vault-irc-user">User236:</span><span class="vault-irc-message"> People click accept because refusal breaks features.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:42]</span> <span class="vault-irc-user">User241:</span><span class="vault-irc-message"> Not every permission deserves blind trust either.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:41]</span> <span class="vault-irc-user">User106:</span><span class="vault-irc-message"> Not every permission is a conspiracy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:39]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> Probably data collection wrapped in convenience.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:38]</span> <span class="vault-irc-user">User106:</span><span class="vault-irc-message"> Probably casting support.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/18/2026 - 20:37]</span> <span class="vault-irc-user">User234:</span><span class="vault-irc-message"> My smart television requested permission to access nearby devices.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 04:01]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> Truth arrived on schedule. The audience did not.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:59]</span> <span class="vault-irc-user">User71:</span><span class="vault-irc-message"> Then the correction is not meant to inform. It is meant to satisfy procedure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:57]</span> <span class="vault-irc-user">User27:</span><span class="vault-irc-message"> Confidence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:56]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> What do they broadcast at noon, @User27?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:55]</span> <span class="vault-irc-user">User27:</span><span class="vault-irc-message"> A fictional network in my story broadcasts corrections at 3 a.m.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:53]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> Otherwise punishment becomes habit and habit becomes policy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:51]</span> <span class="vault-irc-user">User117:</span><span class="vault-irc-message"> Which is why sanctions should have review, exemptions, and actual exit conditions.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:50]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> The moral problem is choosing who pays for someone else&#x27;s decision.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:48]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> And doing nothing turns victims into footnotes.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:47]</span> <span class="vault-irc-user">User185:</span><span class="vault-irc-message"> Exactly. Policy language turns suffering into &#x27;pressure.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:46]</span> <span class="vault-irc-user">User117:</span><span class="vault-irc-message"> There may be no painless option. That does not remove the duty to measure harm.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:45]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> So what is the alternative when a government invades or represses?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:44]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> And elites often route around them while civilians absorb the friction.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:43]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> Targeted sanctions exist for a reason.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:42]</span> <span class="vault-irc-user">User185:</span><span class="vault-irc-message"> That does not make them clean.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:40]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> They are still less destructive than bombing, @User138.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/15/2026 - 03:39]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> Sanctions are described as peaceful even when ordinary people lose medicine and food.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/13/2026 - 13:29]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> Both folders use the same black stamp.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/13/2026 - 13:27]</span> <span class="vault-irc-user">User55:</span><span class="vault-irc-message"> Sometimes secrecy protects lives. Sometimes it protects careers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/13/2026 - 13:26]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Or because secrecy lets a mistake keep its official uniform.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/13/2026 - 13:25]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> Because success advertises competence while failure preserves evidence, @User50.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/13/2026 - 13:24]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Why are failures classified longer than successes in every fictional agency story?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:15]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> And you sound like corporate legal wearing a hoodie.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:14]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> Exactly. You sound like a script-kiddie philosopher.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:13]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Nobody said forever. Stop arguing with the cartoon version of us.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:12]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> So silence forever?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:11]</span> <span class="vault-irc-user">User116:</span><span class="vault-irc-message"> Intent matters less than impact when real people lose data.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:09]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> No, reckless disclosure can hurt users who never consented to your crusade.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:08]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> Responsible disclosure mostly protects companies from embarrassment.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:07]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Then responsible disclosure has timelines, documentation, and escalation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:06]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> And when they bury the report?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:05]</span> <span class="vault-irc-user">User187:</span><span class="vault-irc-message"> You report it. You do not crown yourself sheriff of the internet.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:04]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> That is too simple. What if the company ignores a critical flaw?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/11/2026 - 23:03]</span> <span class="vault-irc-user">User60:</span><span class="vault-irc-message"> Breaking into a system without permission is not research. It is trespassing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/10/2026 - 08:47]</span> <span class="vault-irc-user">User26:</span><span class="vault-irc-message"> And nostalgia is the redacted edition.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/10/2026 - 08:45]</span> <span class="vault-irc-user">User70:</span><span class="vault-irc-message"> Then identity is a biography edited by its own subject.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/10/2026 - 08:44]</span> <span class="vault-irc-user">User20:</span><span class="vault-irc-message"> Yes. The details rearrange themselves to protect the person remembering.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/10/2026 - 08:43]</span> <span class="vault-irc-user">User26:</span><span class="vault-irc-message"> Meaning it changes its story every time we question it, @User20?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/10/2026 - 08:42]</span> <span class="vault-irc-user">User20:</span><span class="vault-irc-message"> Memory feels less like an archive and more like a witness under pressure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:33]</span> <span class="vault-irc-user">User66:</span><span class="vault-irc-message"> Great. We have been here one minute and already the compiler is haunted.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:32]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> Or ordinary bugs are the only language it trusts.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:31]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> This website really enjoys pretending ordinary bugs are prophecy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:30]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> I tried. The chat replaced it with black squares.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:29]</span> <span class="vault-irc-user">User213:</span><span class="vault-irc-message"> Post a fragment.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:28]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> Mine was written in a language I do not recognize.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:27]</span> <span class="vault-irc-user">User66:</span><span class="vault-irc-message"> Then it may read environment data. Nothing supernatural yet.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:26]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> I searched the strings. It is not there.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:25]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> That sounds staged, @User235. Check whether the username is embedded.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:24]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> Mine compiles, but the binary prints my username before I enter it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:23]</span> <span class="vault-irc-user">User34:</span><span class="vault-irc-message"> Yes, but mine contained only one file named awake.c.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/08/2026 - 18:21]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> Did anyone else receive a source archive called midnight_build.zip after logging in?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/07/2026 - 04:06]</span> <span class="vault-irc-user">User96:</span><span class="vault-irc-message"> Language is the only curtain that insists it is a window.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/07/2026 - 04:04]</span> <span class="vault-irc-user">User29:</span><span class="vault-irc-message"> A thousand precise words can create a perfect absence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/07/2026 - 04:02]</span> <span class="vault-irc-user">User65:</span><span class="vault-irc-message"> Exactly. Redaction admits a secret. Jargon buries it without leaving a grave.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/07/2026 - 04:01]</span> <span class="vault-irc-user">User96:</span><span class="vault-irc-message"> Bureaucratic fog, @User65?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/07/2026 - 04:00]</span> <span class="vault-irc-user">User65:</span><span class="vault-irc-message"> The strangest official document is the one with no redactions that still explains nothing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:54]</span> <span class="vault-irc-user">User249:</span><span class="vault-irc-message"> And by then the lie has already chosen a side.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:53]</span> <span class="vault-irc-user">User197:</span><span class="vault-irc-message"> Falsehood arrives as an alarm. Correction arrives as paperwork.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:51]</span> <span class="vault-irc-user">User68:</span><span class="vault-irc-message"> The worst part is that corrections never reach everyone who saw the lie.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:50]</span> <span class="vault-irc-user">User124:</span><span class="vault-irc-message"> Fair insult.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:49]</span> <span class="vault-irc-user">User158:</span><span class="vault-irc-message"> Better than being a gullible rage addict.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:49]</span> <span class="vault-irc-user">User124:</span><span class="vault-irc-message"> Listen to the forensic priest over here.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:47]</span> <span class="vault-irc-user">User158:</span><span class="vault-irc-message"> Time, location, weather, shadows, landmarks, source chain.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:46]</span> <span class="vault-irc-user">User249:</span><span class="vault-irc-message"> That is why provenance matters.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:45]</span> <span class="vault-irc-user">User197:</span><span class="vault-irc-message"> And governments exploit the confusion by calling real evidence fake.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:45]</span> <span class="vault-irc-user">User124:</span><span class="vault-irc-message"> Sometimes accounts knowingly recycle footage because outrage pays.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:44]</span> <span class="vault-irc-user">User249:</span><span class="vault-irc-message"> People share first and verify only after being challenged.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:43]</span> <span class="vault-irc-user">User68:</span><span class="vault-irc-message"> I did. The original video was from years ago.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:41]</span> <span class="vault-irc-user">User158:</span><span class="vault-irc-message"> Reverse-image search it, @User68.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/05/2026 - 13:40]</span> <span class="vault-irc-user">User68:</span><span class="vault-irc-message"> I saw the same explosion labeled as three different countries today.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:30]</span> <span class="vault-irc-user">User201:</span><span class="vault-irc-message"> The CPU understands it and wishes you would stop.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:29]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> Fine. Assembly wins. Nobody understands it enough to complain.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:28]</span> <span class="vault-irc-user">User188:</span><span class="vault-irc-message"> And it has three breaking changes.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:28]</span> <span class="vault-irc-user">User250:</span><span class="vault-irc-message"> JavaScript users have already published a framework for the argument.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:27]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> Python users are watching this fight while importing twelve packages to add two numbers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:26]</span> <span class="vault-irc-user">User201:</span><span class="vault-irc-message"> Every disaster begins with that sentence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:25]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> I know what I am doing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:23]</span> <span class="vault-irc-user">User188:</span><span class="vault-irc-message"> The compiler is stopping you from doing stupid things, @User81.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:22]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> At least C does not make me negotiate with the compiler for custody of a variable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:21]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> Both camps are unbearable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:20]</span> <span class="vault-irc-user">User188:</span><span class="vault-irc-message"> C people talk like segmentation faults build character.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/03/2026 - 23:19]</span> <span class="vault-irc-user">User81:</span><span class="vault-irc-message"> Rust people talk like memory safety was invented last Tuesday.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/02/2026 - 09:04]</span> <span class="vault-irc-user">User30:</span><span class="vault-irc-message"> And every telescope is a courtroom for dead suns.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/02/2026 - 09:02]</span> <span class="vault-irc-user">User41:</span><span class="vault-irc-message"> Then astronomy is archaeology performed with light.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/02/2026 - 09:00]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> That distance can preserve a message long after the sender is gone.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/02/2026 - 08:59]</span> <span class="vault-irc-user">User30:</span><span class="vault-irc-message"> Evidence of what, @User64?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[02/02/2026 - 08:58]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> I watched the stars for an hour and felt like they were evidence, not decoration.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:49]</span> <span class="vault-irc-user">User122:</span><span class="vault-irc-message"> Automation is not destiny. Distribution is policy wearing an engineering mask.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:48]</span> <span class="vault-irc-user">User143:</span><span class="vault-irc-message"> So is pretending markets perform grief counseling.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:47]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> That line is dramatic nonsense.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:46]</span> <span class="vault-irc-user">User143:</span><span class="vault-irc-message"> Anything is better than telling displaced workers to learn code after code displaced them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:46]</span> <span class="vault-irc-user">User122:</span><span class="vault-irc-message"> Universal basic income? Worker ownership? Shorter weeks? Pick a mechanism.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:44]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> No. Share the gains instead of privatizing them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:43]</span> <span class="vault-irc-user">User245:</span><span class="vault-irc-message"> So what, freeze technology forever?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:42]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> Not always for the same people, in the same cities, at the same time.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:41]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> New industries create new jobs.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:40]</span> <span class="vault-irc-user">User143:</span><span class="vault-irc-message"> Only if rent and food stop requiring wages.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:39]</span> <span class="vault-irc-user">User245:</span><span class="vault-irc-message"> If machines replace repetitive labor, people can do better work.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:39]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> Can. That tiny word is carrying the whole economy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:38]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> Productivity gains can raise living standards.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/31/2026 - 18:37]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> They keep saying automation will free workers, but nobody explains who owns the freedom.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/30/2026 - 04:22]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> Distance winning so completely that even light resigns.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/30/2026 - 04:20]</span> <span class="vault-irc-user">User63:</span><span class="vault-irc-message"> A universe still full of things, yet empty of meetings.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/30/2026 - 04:18]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> Yes, but the loneliness of it bothered me more than the physics.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/30/2026 - 04:17]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> The heat-death idea, @User12?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/30/2026 - 04:16]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> I read that the universe may end with everything too far apart to touch.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:07]</span> <span class="vault-irc-user">User99:</span><span class="vault-irc-message"> A secure door can frustrate justice. An insecure door can destroy everyone.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:06]</span> <span class="vault-irc-user">User68:</span><span class="vault-irc-message"> No right is absolute. That does not make a broken cryptosystem wise.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:05]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> So privacy becomes absolute?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:04]</span> <span class="vault-irc-user">User223:</span><span class="vault-irc-message"> You cannot legislate a key that obeys jurisdiction.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:03]</span> <span class="vault-irc-user">User95:</span><span class="vault-irc-message"> Mathematics does not care whether the warrant is sincere.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:02]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> That is dramatic nonsense.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:01]</span> <span class="vault-irc-user">User99:</span><span class="vault-irc-message"> Exceptional access is a political phrase for universal vulnerability.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 14:00]</span> <span class="vault-irc-user">User68:</span><span class="vault-irc-message"> Weakening the lock weakens it for stalkers, criminals, and foreign agencies too.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 13:58]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> Easy to say until evidence is locked behind a phone.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 13:57]</span> <span class="vault-irc-user">User223:</span><span class="vault-irc-message"> Then target devices, not everyone\u2019s encryption.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 13:56]</span> <span class="vault-irc-user">User138:</span><span class="vault-irc-message"> Law enforcement still needs access in serious cases.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/28/2026 - 13:56]</span> <span class="vault-irc-user">User95:</span><span class="vault-irc-message"> There is no such thing as a backdoor only good people can use.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/26/2026 - 23:40]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> A cage built from policy menus still locks from the outside.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/26/2026 - 23:38]</span> <span class="vault-irc-user">User62:</span><span class="vault-irc-message"> That is scarier because the system can call exclusion a technical outcome.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/26/2026 - 23:37]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> Exactly. Nobody is arrested. Their access simply expires.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/26/2026 - 23:36]</span> <span class="vault-irc-user">User84:</span><span class="vault-irc-message"> Not through medicine, but through eligibility scores, @User44?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/26/2026 - 23:35]</span> <span class="vault-irc-user">User44:</span><span class="vault-irc-message"> In my dystopian story, the Health Ministry controls people by changing the definition of healthy.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:26]</span> <span class="vault-irc-user">User39:</span><span class="vault-irc-message"> Which is why mature judgment matters more than dramatic rules.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:26]</span> <span class="vault-irc-user">User104:</span><span class="vault-irc-message"> The line between education and enablement moves with context.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:25]</span> <span class="vault-irc-user">User71:</span><span class="vault-irc-message"> Not fully responsible, but not magically innocent either.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:24]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Researchers are not responsible for every idiot who misuses knowledge.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:23]</span> <span class="vault-irc-user">User102:</span><span class="vault-irc-message"> So is pretending every technical detail serves the public.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:22]</span> <span class="vault-irc-user">User39:</span><span class="vault-irc-message"> Security through silence is weak.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:20]</span> <span class="vault-irc-user">User71:</span><span class="vault-irc-message"> Publish defensive findings, omit reusable attack details.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:19]</span> <span class="vault-irc-user">User104:</span><span class="vault-irc-message"> That does not mean we should improve their manuals.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:17]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Most copycats can already buy builders in private forums.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:16]</span> <span class="vault-irc-user">User102:</span><span class="vault-irc-message"> Detailed internals can also help copycats.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:15]</span> <span class="vault-irc-user">User39:</span><span class="vault-irc-message"> Indicators and behavior help defenders.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/25/2026 - 09:14]</span> <span class="vault-irc-user">User104:</span><span class="vault-irc-message"> I spent all night analyzing a ransomware sample and still cannot decide whether publishing the report helps.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/23/2026 - 18:59]</span> <span class="vault-irc-user">User23:</span><span class="vault-irc-message"> The sentence becomes architecture before anyone notices the bricks.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/23/2026 - 18:57]</span> <span class="vault-irc-user">User93:</span><span class="vault-irc-message"> Shared language does not prove coordination, but repetition can still shape perception.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/23/2026 - 18:55]</span> <span class="vault-irc-user">User11:</span><span class="vault-irc-message"> Yes. Same wording, same pause, same calm expression.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/23/2026 - 18:54]</span> <span class="vault-irc-user">User23:</span><span class="vault-irc-message"> About the fictional transit failure, @User11?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/23/2026 - 18:53]</span> <span class="vault-irc-user">User11:</span><span class="vault-irc-message"> Four news channels used the phrase &#x27;isolated incident&#x27; tonight.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:44]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> That sentence would get you removed from half the palaces ever built.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:43]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> Faith should make power answerable, not untouchable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:42]</span> <span class="vault-irc-user">User203:</span><span class="vault-irc-message"> Which is why holy framing is political gasoline.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:41]</span> <span class="vault-irc-user">User140:</span><span class="vault-irc-message"> And once a war is holy, compromise looks like betrayal.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:40]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Nothing turns policy into destiny faster than claiming heaven signed the memo.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:39]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Institutions still love sacred vocabulary when ordinary arguments fail.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:38]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> Exactly. Stop using religion as a single block.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:37]</span> <span class="vault-irc-user">User203:</span><span class="vault-irc-message"> Religious language can restrain violence or sanctify it. History has receipts for both.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:35]</span> <span class="vault-irc-user">User140:</span><span class="vault-irc-message"> I am criticizing rulers, not faith.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:34]</span> <span class="vault-irc-user">User64:</span><span class="vault-irc-message"> That is unfair to believers who opposed wars.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:33]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Because divine approval is cheaper than public consent.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/22/2026 - 04:32]</span> <span class="vault-irc-user">User140:</span><span class="vault-irc-message"> Why does every empire eventually discover that God supports its supply lines?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:24]</span> <span class="vault-irc-user">User130:</span><span class="vault-irc-message"> The vulnerability market exists because trust failed before the exploit did.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:23]</span> <span class="vault-irc-user">User219:</span><span class="vault-irc-message"> Not every executive bonus is either, but here we are.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:21]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Not every bug is worth a fortune.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:20]</span> <span class="vault-irc-user">User198:</span><span class="vault-irc-message"> Bug bounties that pay less than a used laptop are insulting.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:19]</span> <span class="vault-irc-user">User77:</span><span class="vault-irc-message"> There also needs to be compensation for researchers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:18]</span> <span class="vault-irc-user">User130:</span><span class="vault-irc-message"> There needs to be a risk-based timeline.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:17]</span> <span class="vault-irc-user">User219:</span><span class="vault-irc-message"> So vendors get infinite time while everyone stays exposed?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:17]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Public disclosure can also hand criminals a weapon.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:15]</span> <span class="vault-irc-user">User198:</span><span class="vault-irc-message"> The problem is stockpiling without accountability.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:14]</span> <span class="vault-irc-user">User77:</span><span class="vault-irc-message"> And the same flaw can later be used against hospitals or journalists.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:13]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Some vulnerabilities help intelligence agencies stop real threats.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/20/2026 - 14:12]</span> <span class="vault-irc-user">User219:</span><span class="vault-irc-message"> Selling zero-days to governments is just arms dealing with cleaner furniture.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/18/2026 - 23:56]</span> <span class="vault-irc-user">User38:</span><span class="vault-irc-message"> The danger begins when we forget which walls were built by agreement.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/18/2026 - 23:54]</span> <span class="vault-irc-user">User99:</span><span class="vault-irc-message"> That does not make them meaningless. A promise is invisible too.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/18/2026 - 23:53]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Yes. Imaginary structures become real when enough people coordinate around them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/18/2026 - 23:52]</span> <span class="vault-irc-user">User38:</span><span class="vault-irc-message"> Money, borders, offices, titles, all of it, @User18?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/18/2026 - 23:51]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Maybe humanity&#x27;s greatest invention is not language but shared pretending.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:42]</span> <span class="vault-irc-user">User199:</span><span class="vault-irc-message"> There are still villains in bright boardrooms, clown.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:41]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> True. Incentives can create cruelty without a villain in a dark room.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:40]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> The system does not need to be secretly controlled to be brutally predictable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:40]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> Thank you, @User190, for arriving with nuance after the furniture was thrown.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:39]</span> <span class="vault-irc-user">User190:</span><span class="vault-irc-message"> Both state control and pure speculation can produce shortages for different reasons.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:37]</span> <span class="vault-irc-user">User199:</span><span class="vault-irc-message"> Your argument is &#x27;let the machine eat until it becomes efficient.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:36]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> At least I have an argument, not a poster.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:35]</span> <span class="vault-irc-user">User199:</span><span class="vault-irc-message"> And your market sermon ignores landlords buying entire blocks.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:34]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> That slogan ignores construction costs and zoning.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:32]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> Homes are already being built for portfolios, not people.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:31]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> Without investment, fewer homes get built.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/17/2026 - 09:30]</span> <span class="vault-irc-user">User235:</span><span class="vault-irc-message"> Housing should not be treated like a casino chip.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/15/2026 - 19:15]</span> <span class="vault-irc-user">User89:</span><span class="vault-irc-message"> The first alien message might be a prayer we cannot recognize.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/15/2026 - 19:13]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> Or maybe religion is not about ignorance at all, but about relationship and awe.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/15/2026 - 19:11]</span> <span class="vault-irc-user">User42:</span><span class="vault-irc-message"> Maybe every species invents meaning before it understands mortality.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/15/2026 - 19:10]</span> <span class="vault-irc-user">User89:</span><span class="vault-irc-message"> Only if uncertainty follows intelligence everywhere, @User42.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/15/2026 - 19:09]</span> <span class="vault-irc-user">User42:</span><span class="vault-irc-message"> Do you think extraterrestrial life would have religion?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 05:05]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> Deal, if red stops naming operations like rejected action movies.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 05:04]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Fine. I will share my notes when blue stops calling every shell &#x27;unexpected behavior.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 05:02]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Still better than two teams hiding information to protect their egos.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 05:01]</span> <span class="vault-irc-user">User200:</span><span class="vault-irc-message"> Purple teaming often means scheduling another meeting.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 05:00]</span> <span class="vault-irc-user">User182:</span><span class="vault-irc-message"> Purple teaming exists because adults got tired of this argument.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:59]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> And a hundred pages of compliance language is not defense.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:57]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> Exactly. A dramatic screenshot is not a remediation plan.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:56]</span> <span class="vault-irc-user">User227:</span><span class="vault-irc-message"> Reports should explain path, impact, assumptions, and detection opportunities.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:54]</span> <span class="vault-irc-user">User200:</span><span class="vault-irc-message"> I wanted reproducible details, not hacker poetry.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:54]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> If the domain was compromised, what did you want, a sympathy card?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:52]</span> <span class="vault-irc-user">User200:</span><span class="vault-irc-message"> Tell that to the red team that wrote &#x27;domain compromised&#x27; and went home.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:51]</span> <span class="vault-irc-user">User137:</span><span class="vault-irc-message"> Both teams need each other.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:50]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Blue teams act like blocking one payload means the network is secure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/14/2026 - 04:49]</span> <span class="vault-irc-user">User76:</span><span class="vault-irc-message"> Red teams act like breaking one path proves the entire defense is useless.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/12/2026 - 14:33]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> A sacred question can survive. A sacred bureaucracy usually wants passwords.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/12/2026 - 14:31]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Probably the moment someone claims they are the only authorized interpreter.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/12/2026 - 14:30]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> I know. I am wondering when mystery becomes property.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/12/2026 - 14:29]</span> <span class="vault-irc-user">User31:</span><span class="vault-irc-message"> Because faith and institutions are not the same thing, @User33.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/12/2026 - 14:28]</span> <span class="vault-irc-user">User33:</span><span class="vault-irc-message"> Why do so many religions describe truth as light but keep their oldest records behind locked doors?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:19]</span> <span class="vault-irc-user">User185:</span><span class="vault-irc-message"> Professionalism is slow, but rage is terrible evidence management.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:18]</span> <span class="vault-irc-user">User96:</span><span class="vault-irc-message"> And your plan is tantrum-driven disclosure, genius.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:17]</span> <span class="vault-irc-user">User222:</span><span class="vault-irc-message"> That is polite language for begging.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:16]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Ask for reevaluation and reference the exact impact.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:15]</span> <span class="vault-irc-user">User28:</span><span class="vault-irc-message"> I am tired of companies treating researchers like disposable alarms.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:14]</span> <span class="vault-irc-user">User185:</span><span class="vault-irc-message"> And public shaming can accidentally expose users.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:13]</span> <span class="vault-irc-user">User222:</span><span class="vault-irc-message"> Platforms protect clients because clients pay.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:11]</span> <span class="vault-irc-user">User96:</span><span class="vault-irc-message"> Do not. Escalate through the platform first.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:10]</span> <span class="vault-irc-user">User222:</span><span class="vault-irc-message"> Publicly shame them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:09]</span> <span class="vault-irc-user">User28:</span><span class="vault-irc-message"> Screenshots, timestamps, request logs, everything.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:08]</span> <span class="vault-irc-user">User50:</span><span class="vault-irc-message"> Did you keep evidence?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/11/2026 - 00:07]</span> <span class="vault-irc-user">User28:</span><span class="vault-irc-message"> A company closed my valid bug report as &#x27;informative&#x27; and fixed it quietly two days later.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/09/2026 - 09:51]</span> <span class="vault-irc-user">User37:</span><span class="vault-irc-message"> Or the one with consequences sharp enough to keep us obedient.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/09/2026 - 09:49]</span> <span class="vault-irc-user">User23:</span><span class="vault-irc-message"> Maybe reality is just the dream with better continuity.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/09/2026 - 09:48]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Exactly. In dreams we question everything. Awake, we question almost nothing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/09/2026 - 09:47]</span> <span class="vault-irc-user">User37:</span><span class="vault-irc-message"> Because we accept one reality faster than the other, @User18?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/09/2026 - 09:46]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> Does anyone else think waking up is stranger than dreaming?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:39]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> I came here seeking answers. Now I am not sure the questions are mine.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:38]</span> <span class="vault-irc-user">User163:</span><span class="vault-irc-message"> Those are not equally comforting possibilities.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:36]</span> <span class="vault-irc-user">User209:</span><span class="vault-irc-message"> Then either you are lying, the site is predicting handles, or someone invited you before you arrived.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:35]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> It disappeared when I refreshed.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:33]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Post the screenshot.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:32]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> No. I saw a message from my username before I registered it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:31]</span> <span class="vault-irc-user">User67:</span><span class="vault-irc-message"> That only proves the server keeps time.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:30]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> The timestamps continue when I close the page.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:29]</span> <span class="vault-irc-user">User163:</span><span class="vault-irc-message"> What makes you think they are collected?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:28]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> The people collecting these chats.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:27]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> Which team, @User170?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/07/2026 - 19:25]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> Hello? Is anyone here actually part of the team behind this site?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:17]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> Yes, the attacker will be emotionally overwhelmed.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:16]</span> <span class="vault-irc-user">User85:</span><span class="vault-irc-message"> The exclamation mark means it is secure.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:15]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> Better priesthood than &#x27;Password1234!&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:14]</span> <span class="vault-irc-user">User116:</span><span class="vault-irc-message"> Here comes the authentication priesthood.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:13]</span> <span class="vault-irc-user">User180:</span><span class="vault-irc-message"> Not SMS if you can avoid it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:12]</span> <span class="vault-irc-user">User48:</span><span class="vault-irc-message"> Use a password manager and multi-factor authentication.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:10]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> Public biographical trivia pretending to be authentication.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:09]</span> <span class="vault-irc-user">User85:</span><span class="vault-irc-message"> We also have security questions asking for my first school.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:08]</span> <span class="vault-irc-user">User116:</span><span class="vault-irc-message"> Compliance worships checkboxes because checkboxes do not argue back.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:07]</span> <span class="vault-irc-user">User180:</span><span class="vault-irc-message"> Tell compliance, not us.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:05]</span> <span class="vault-irc-user">User128:</span><span class="vault-irc-message"> That policy creates predictable passwords with different numbers.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/06/2026 - 05:05]</span> <span class="vault-irc-user">User85:</span><span class="vault-irc-message"> My company still forces password changes every thirty days.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/04/2026 - 14:49]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> The tragedy is that truth and noise often arrive wearing the same alarm bell.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/04/2026 - 14:47]</span> <span class="vault-irc-user">User15:</span><span class="vault-irc-message"> Sometimes warnings are ignored. Sometimes false alarms exhaust attention.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/04/2026 - 14:46]</span> <span class="vault-irc-user">User74:</span><span class="vault-irc-message"> And because institutions hear inconvenient evidence as disloyalty.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/04/2026 - 14:45]</span> <span class="vault-irc-user">User94:</span><span class="vault-irc-message"> Because competence makes a good ghost, @User74.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/04/2026 - 14:44]</span> <span class="vault-irc-user">User74:</span><span class="vault-irc-message"> Have you ever wondered why every apocalypse story begins with ignored experts?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:37]</span> <span class="vault-irc-user">User112:</span><span class="vault-irc-message"> Not the truth. The part of you that can survive hearing more than one version of it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:36]</span> <span class="vault-irc-user">User196:</span><span class="vault-irc-message"> Then what am I supposed to find here?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:35]</span> <span class="vault-irc-user">User186:</span><span class="vault-irc-message"> War is not inevitable. That belief is one of its favorite recruiters.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:34]</span> <span class="vault-irc-user">User36:</span><span class="vault-irc-message"> You forgot war.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:33]</span> <span class="vault-irc-user">User180:</span><span class="vault-irc-message"> Except taxes and somebody ruining the chat with a bad joke.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:32]</span> <span class="vault-irc-user">User112:</span><span class="vault-irc-message"> Nothing built by humans is inevitable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:31]</span> <span class="vault-irc-user">User73:</span><span class="vault-irc-message"> Governments, religions, markets, media, rebels: everyone wants their story to feel inevitable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:30]</span> <span class="vault-irc-user">User36:</span><span class="vault-irc-message"> And certainty without evidence is propaganda.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:29]</span> <span class="vault-irc-user">User186:</span><span class="vault-irc-message"> Doubt without discipline is paranoia. Doubt with evidence is inquiry.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:27]</span> <span class="vault-irc-user">User196:</span><span class="vault-irc-message"> So the purpose of the site is just doubt?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:26]</span> <span class="vault-irc-user">User180:</span><span class="vault-irc-message"> And upgraded excuses.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:24]</span> <span class="vault-irc-user">User73:</span><span class="vault-irc-message"> Human beings repeating the same fear with upgraded weapons.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:24]</span> <span class="vault-irc-user">User112:</span><span class="vault-irc-message"> Maybe that is the hidden file, @User196.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/03/2026 - 00:23]</span> <span class="vault-irc-user">User196:</span><span class="vault-irc-message"> I joined this place looking for hidden files. Instead I found people arguing about every century.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/01/2026 - 10:07]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> Nothing looks less violent than a red circle on a clean screen.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/01/2026 - 10:05]</span> <span class="vault-irc-user">User37:</span><span class="vault-irc-message"> That belongs in dystopian fiction because it combines unrelated data under one harmless icon.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/01/2026 - 10:04]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> Officially. Secretly it also scores political reliability and purchasing behavior.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/01/2026 - 10:03]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> Based on medical risk, @User32?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[01/01/2026 - 10:02]</span> <span class="vault-irc-user">User32:</span><span class="vault-irc-message"> The fictional Ministry&#x27;s health app gives citizens a green, amber, or red status.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:53]</span> <span class="vault-irc-user">User98:</span><span class="vault-irc-message"> And every policy document eventually becomes an incident report.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:51]</span> <span class="vault-irc-user">User35:</span><span class="vault-irc-message"> The cloud did not remove infrastructure. It replaced screws with policy documents.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:50]</span> <span class="vault-irc-user">User126:</span><span class="vault-irc-message"> Excellent strategy, grandfather.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:49]</span> <span class="vault-irc-user">User97:</span><span class="vault-irc-message"> At least when my server fails, I know which basement to curse.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:48]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> On-premises systems are not automatically safer.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:47]</span> <span class="vault-irc-user">User98:</span><span class="vault-irc-message"> Complexity becomes a vulnerability when nobody understands the whole system.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:46]</span> <span class="vault-irc-user">User126:</span><span class="vault-irc-message"> That is misconfiguration, not magic.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:45]</span> <span class="vault-irc-user">User35:</span><span class="vault-irc-message"> And one wrong permission exposes a bucket to the planet.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:44]</span> <span class="vault-irc-user">User126:</span><span class="vault-irc-message"> No, cloud platforms provide controls most small companies could never build.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:43]</span> <span class="vault-irc-user">User97:</span><span class="vault-irc-message"> Still accurate.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:42]</span> <span class="vault-irc-user">User152:</span><span class="vault-irc-message"> That joke is older than half the users here.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/30/2025 - 19:41]</span> <span class="vault-irc-user">User35:</span><span class="vault-irc-message"> Cloud security is just someone else\u2019s computer plus fifty dashboards.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/29/2025 - 05:26]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> The watcher moved inside and stopped needing electricity.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/29/2025 - 05:24]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> That is unsettling. Appearance became a private police force.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/29/2025 - 05:23]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> They trained us to monitor ourselves before cameras existed.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/29/2025 - 05:22]</span> <span class="vault-irc-user">User57:</span><span class="vault-irc-message"> They do not record anything, @User18.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/29/2025 - 05:21]</span> <span class="vault-irc-user">User18:</span><span class="vault-irc-message"> I think mirrors are the oldest surveillance devices.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:12]</span> <span class="vault-irc-user">User131:</span><span class="vault-irc-message"> Good code is not code without arguments. It is code where the arguments end before production.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:12]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> A historic victory for civilization.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:11]</span> <span class="vault-irc-user">User36:</span><span class="vault-irc-message"> And now nobody will confuse cacheAge with userAge.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:10]</span> <span class="vault-irc-user">User244:</span><span class="vault-irc-message"> You renamed one variable for two hours yesterday.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:09]</span> <span class="vault-irc-user">User36:</span><span class="vault-irc-message"> Naming matters more than both.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:07]</span> <span class="vault-irc-user">User111:</span><span class="vault-irc-message"> Tests can be unreadable too.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:06]</span> <span class="vault-irc-user">User131:</span><span class="vault-irc-message"> Tests preserve behavior better than comments.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:05]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> Brilliant. Why did nobody think of maintaining software?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:04]</span> <span class="vault-irc-user">User244:</span><span class="vault-irc-message"> Then update them.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:02]</span> <span class="vault-irc-user">User170:</span><span class="vault-irc-message"> Most comments become lies after the third refactor.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:01]</span> <span class="vault-irc-user">User111:</span><span class="vault-irc-message"> Comments explain intent, not syntax.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/27/2025 - 15:00]</span> <span class="vault-irc-user">User36:</span><span class="vault-irc-message"> If your function needs forty comments, the function is the problem.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/26/2025 - 00:44]</span> <span class="vault-irc-user">User29:</span><span class="vault-irc-message"> A room full of doubters can still produce unanimous applause.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/26/2025 - 00:42]</span> <span class="vault-irc-user">User78:</span><span class="vault-irc-message"> Then consensus can be built from fear rather than belief.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/26/2025 - 00:41]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> Yes. Everyone sees the contradiction, but nobody wants to be first to name it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/26/2025 - 00:40]</span> <span class="vault-irc-user">User29:</span><span class="vault-irc-message"> A shared silence, @User86?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/26/2025 - 00:39]</span> <span class="vault-irc-user">User86:</span><span class="vault-irc-message"> What if the first lie was not spoken but agreed upon?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:30]</span> <span class="vault-irc-user">User242:</span><span class="vault-irc-message"> A precise lie often travels farther than an uncertain truth.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:28]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> So does humility.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:27]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> Verification matters most when emotions are hottest.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:26]</span> <span class="vault-irc-user">User213:</span><span class="vault-irc-message"> The public wants one number. Reality offers a moving graveyard.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:25]</span> <span class="vault-irc-user">User182:</span><span class="vault-irc-message"> That is too boring for television and too honest for rage accounts.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:24]</span> <span class="vault-irc-user">User242:</span><span class="vault-irc-message"> Use ranges, explain methodology, update when evidence changes.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:22]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> No, but refusing every estimate also hides the dead.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:22]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> That does not mean we repeat numbers blindly.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:21]</span> <span class="vault-irc-user">User182:</span><span class="vault-irc-message"> And some governments call every inconvenient count unreliable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:20]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> Some sources are genuinely unreliable.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:19]</span> <span class="vault-irc-user">User213:</span><span class="vault-irc-message"> Because uncertainty is treated like weakness.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/24/2025 - 10:18]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> Why do people quote casualty numbers only when the source flatters their politics?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:11]</span> <span class="vault-irc-user">User169:</span><span class="vault-irc-message"> Do not open the next build until someone checks who compiled us.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:10]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> Then explain why my username appears in a commit dated tomorrow.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:09]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> That is nonsense.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:08]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> Maybe this place is not storing our messages. Maybe it is training us to write its source code.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:07]</span> <span class="vault-irc-user">User169:</span><span class="vault-irc-message"> Or deliberate. Ninety-nine percent proves access without allowing possession.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:06]</span> <span class="vault-irc-user">User85:</span><span class="vault-irc-message"> Convenient.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:05]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> The repository vanished when the download reached ninety-nine percent.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:04]</span> <span class="vault-irc-user">User107:</span><span class="vault-irc-message"> Did you clone it?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:03]</span> <span class="vault-irc-user">User153:</span><span class="vault-irc-message"> Some of those users were not born then.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:02]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> A commit history going back to 1998, but every author name is a user from this chat.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 20:01]</span> <span class="vault-irc-user">User51:</span><span class="vault-irc-message"> What was inside?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 19:59]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> There was for eleven seconds after midnight.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 19:58]</span> <span class="vault-irc-user">User85:</span><span class="vault-irc-message"> There is no footer link.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/22/2025 - 19:57]</span> <span class="vault-irc-user">User162:</span><span class="vault-irc-message"> I found a hidden repository in the site footer called final_listener.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/21/2025 - 05:42]</span> <span class="vault-irc-user">User88:</span><span class="vault-irc-message"> The real question is who bears the cost of silence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/21/2025 - 05:40]</span> <span class="vault-irc-user">User43:</span><span class="vault-irc-message"> But forced disclosure can harm people too. Transparency is not automatically moral.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/21/2025 - 05:38]</span> <span class="vault-irc-user">User47:</span><span class="vault-irc-message"> Yes. Ignorance can feel like innocence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/21/2025 - 05:37]</span> <span class="vault-irc-user">User88:</span><span class="vault-irc-message"> Because knowledge creates responsibility, @User47?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/21/2025 - 05:36]</span> <span class="vault-irc-user">User47:</span><span class="vault-irc-message"> What scares me is not that governments keep secrets. It is that citizens sometimes beg not to know.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:31]</span> <span class="vault-irc-user">User189:</span><span class="vault-irc-message"> Every generation inherits the war and rewrites who was brave.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:30]</span> <span class="vault-irc-user">User146:</span><span class="vault-irc-message"> Nobody did. Stop shadowboxing.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:28]</span> <span class="vault-irc-user">User236:</span><span class="vault-irc-message"> Do not flatten journalists, activists, and propagandists into one pile.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:28]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Different technology, same emotional manipulation.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:26]</span> <span class="vault-irc-user">User103:</span><span class="vault-irc-message"> Now social media brings every fragment without context.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:25]</span> <span class="vault-irc-user">User189:</span><span class="vault-irc-message"> Television brought the war into living rooms, but edited into nightly fragments.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:24]</span> <span class="vault-irc-user">User146:</span><span class="vault-irc-message"> It is structural, not secret. Distance reduces political cost.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:23]</span> <span class="vault-irc-user">User236:</span><span class="vault-irc-message"> That sounds conspiratorial.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:22]</span> <span class="vault-irc-user">User146:</span><span class="vault-irc-message"> Which is why leaders prefer wars fought by volunteers and watched through screens.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:20]</span> <span class="vault-irc-user">User103:</span><span class="vault-irc-message"> The draft made political decisions physically unavoidable for families.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:19]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> Some were. Some treated returning soldiers like symbols instead of damaged people.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:19]</span> <span class="vault-irc-user">User236:</span><span class="vault-irc-message"> Some protests were righteous, @User164.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:17]</span> <span class="vault-irc-user">User164:</span><span class="vault-irc-message"> And how protesters imagine themselves as automatically righteous.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/19/2025 - 15:16]</span> <span class="vault-irc-user">User189:</span><span class="vault-irc-message"> The Vietnam War still shapes how governments fear public dissent during long conflicts.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/18/2025 - 01:00]</span> <span class="vault-irc-user">User87:</span><span class="vault-irc-message"> The machine waits until evidence arrives, then remembers how to be ordinary.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/18/2025 - 00:58]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> That is how every good mystery recruits its witness.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/18/2025 - 00:57]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> Probably transformers. But it stopped the second I recorded it.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/18/2025 - 00:56]</span> <span class="vault-irc-user">User87:</span><span class="vault-irc-message"> Electrical infrastructure, @User75, or the universe tuning itself?</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/18/2025 - 00:55]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> I heard a low hum under the city again last night.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:50]</span> <span class="vault-irc-user">User110:</span><span class="vault-irc-message"> Every revolution eventually discovers access control.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:49]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> The hype is exaggerated. The risk is merely underdesigned.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:48]</span> <span class="vault-irc-user">User15:</span><span class="vault-irc-message"> The panic is exaggerated.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:46]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> Exactly. New interface, ancient negligence.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:45]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> So the same security principles we ignored in every previous platform.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:43]</span> <span class="vault-irc-user">User110:</span><span class="vault-irc-message"> Use least privilege, isolation, logging, and explicit approvals.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:42]</span> <span class="vault-irc-user">User146:</span><span class="vault-irc-message"> That is not an excuse to automate mistakes at machine speed.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:41]</span> <span class="vault-irc-user">User15:</span><span class="vault-irc-message"> Humans are also unreliable authorities.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:40]</span> <span class="vault-irc-user">User75:</span><span class="vault-irc-message"> The model should never be the final authority for sensitive actions.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:40]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> Which they are doing everywhere.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:39]</span> <span class="vault-irc-user">User145:</span><span class="vault-irc-message"> Only if developers connect the model to dangerous capabilities.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:37]</span> <span class="vault-irc-user">User146:</span><span class="vault-irc-message"> No, but it can still manipulate tools, data access, and decisions.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:35]</span> <span class="vault-irc-user">User15:</span><span class="vault-irc-message"> Prompt injection is not the same as remote code execution.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/16/2025 - 10:34]</span> <span class="vault-irc-user">User12:</span><span class="vault-irc-message"> People keep treating AI systems like chat boxes instead of software with attack surfaces.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/14/2025 - 20:19]</span> <span class="vault-irc-user">User91:</span><span class="vault-irc-message"> Statistics are honest tools that can be made to wear dishonest costumes.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/14/2025 - 20:17]</span> <span class="vault-irc-user">User74:</span><span class="vault-irc-message"> Numbers never speak for themselves. Someone chooses the scale, sample, and comparison.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/14/2025 - 20:16]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> The presenter kept saying &#x27;the numbers speak for themselves.&#x27;</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/14/2025 - 20:15]</span> <span class="vault-irc-user">User91:</span><span class="vault-irc-message"> That is a classic way to make change look dramatic, @User54.</span></div>\n      <div class="vault-irc-line"><span class="vault-irc-time">[12/14/2025 - 20:14]</span> <span class="vault-irc-user">User54:</span><span class="vault-irc-message"> The evening bulletin showed a graph without labeling the vertical axis.</span></div>\n      <div class="vault-irc-line vault-irc-system">[Error while loading messages...]</div>\n      </div>\n    </section>\n  </main>\n</body>\n</html>\n';

// src/websites/pages/vault-guard-redirect.html
var vault_guard_redirect_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=https://vault.org/?error" />
  <title>Redirecting | The Vault</title>
  <link rel="stylesheet" href="vault/vault.css" />
</head>
<body class="vault-redirect-page" onload="HackhubSDK.Browser.navigate('https://vault.org/?error')">
  <p><a href="https://vault.org/?error">Return to the Vault login</a></p>
</body>
</html>
`;

// src/websites/VaultWebsite.ts
var VAULT_AUTH_KEY = "vault.memberAuthenticated";
function isVaultMember() {
  return import_hackhub_content_sdk15.Variables.get(VAULT_AUTH_KEY) === true;
}
function protectedMetadata(title, html) {
  if (!isVaultMember()) {
    return {
      title: "Members Only | The Vault",
      description: "This Vault directory is restricted to authenticated members.",
      html: vault_guard_redirect_default
    };
  }
  return { title, html };
}
var VaultWebsite = class extends import_hackhub_content_sdk15.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "The Vault";
    this.Host = "vault.org";
    this.Icon = "mod-asset://nemesis-protocol-stage1/vault/assets/vault-icon.png";
    this.Popular = false;
    this.Pages = [
      {
        path: "/",
        seo: true,
        metadata(context) {
          const hasError = Object.prototype.hasOwnProperty.call(context.query, "error");
          if (hasError) {
            return {
              title: "Members Only | The Vault",
              description: "Only members of the Vault may access protected directories.",
              html: vault_error_default,
              search: ["vault", "members only", "restricted archive"]
            };
          }
          if (isVaultMember()) {
            return {
              title: "The Vault | Member",
              description: "Authenticated member archive.",
              html: vault_member_default,
              search: ["vault", "archive", "member"]
            };
          }
          return {
            title: "The Vault",
            description: "Some doors are sealed to keep the world out. Others are sealed to keep it from looking in.",
            html: vault_login_default,
            search: ["vault", "login", "private archive"]
          };
        }
      },
      {
        path: "/members_home",
        seo: false,
        metadata() {
          return protectedMetadata("The Vault | Member", vault_member_default);
        }
      },
      {
        path: "/members_revelation",
        seo: false,
        metadata() {
          return protectedMetadata("Revelation | The Vault", vault_revelation_default);
        }
      },
      {
        path: "/members_irc",
        seo: false,
        metadata() {
          return protectedMetadata("IRC | The Vault", vault_irc_default);
        }
      },
      {
        path: "/members_ark",
        seo: false,
        metadata() {
          return protectedMetadata("Ark | The Vault", vault_ark_default);
        }
      }
    ];
  }
};
VaultWebsite = __decorateClass([
  import_hackhub_content_sdk15.RegisterWebsite
], VaultWebsite);

// src/websites/MarianaIndexWebsite.ts
var import_hackhub_content_sdk16 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/mariana-index.html
var mariana_index_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Mariana Index</title>\n  <style>\n    html, body {\n      margin: 0;\n      min-height: 100%;\n      background: #000;\n    }\n  </style>\n</head>\n<body></body>\n</html>\n';

// src/websites/MarianaIndexWebsite.ts
function isMariProtocolUrl(url) {
  return url.toLowerCase().startsWith(`mari://${MARIANA_HOST}`);
}
var MarianaIndexWebsite = class extends import_hackhub_content_sdk16.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "Mariana Index";
    this.Host = MARIANA_HOST;
    this.Icon = "";
    this.Popular = false;
    this.Pages = [
      {
        path: "/",
        seo: false,
        metadata(context) {
          if (!isMarianaResolverActive() || !isMariProtocolUrl(context.url)) {
            return null;
          }
          return {
            title: "Mariana Index",
            html: mariana_index_default
          };
        }
      }
    ];
  }
};
MarianaIndexWebsite = __decorateClass([
  import_hackhub_content_sdk16.RegisterWebsite
], MarianaIndexWebsite);

// src/websites/AbyssRepoWebsite.ts
var import_hackhub_content_sdk17 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/repo-abyss-seized.html
var repo_abyss_seized_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Repository Seized</title>\n  <style>\n    :root { color-scheme: light; }\n    * { box-sizing: border-box; }\n    body {\n      margin: 0;\n      min-height: 100vh;\n      background: #e8edf2;\n      color: #0d1721;\n      font-family: Georgia, "Times New Roman", serif;\n    }\n    .topbar {\n      background: #071424;\n      color: #fff;\n      border-bottom: 8px solid #8b1f28;\n      padding: 18px 6vw;\n      display: flex;\n      align-items: center;\n      gap: 18px;\n    }\n    .seal {\n      width: 82px;\n      height: 82px;\n      border-radius: 50%;\n      border: 4px solid #d9c27b;\n      background: radial-gradient(circle, #f8f1d0 0 35%, #18345c 36% 64%, #d9c27b 65% 100%);\n      display: grid;\n      place-items: center;\n      color: #071424;\n      font: 900 24px Arial, sans-serif;\n      letter-spacing: 0.08em;\n      box-shadow: 0 0 0 3px rgba(255,255,255,.22) inset;\n      flex: none;\n    }\n    .agency-title { font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: .14em; font-weight: 800; }\n    .agency-title small { display: block; color: #c8d3df; font-size: 11px; margin-top: 6px; letter-spacing: .2em; }\n    main { max-width: 980px; margin: 46px auto; padding: 0 24px 70px; }\n    .notice {\n      background: #fff;\n      border: 1px solid #c4cbd3;\n      box-shadow: 0 20px 50px rgba(7,20,36,.12);\n    }\n    .notice-head {\n      background: repeating-linear-gradient(135deg, #8b1f28 0 18px, #751821 18px 36px);\n      color: #fff;\n      padding: 18px 24px;\n      font-family: Arial, sans-serif;\n      text-transform: uppercase;\n      letter-spacing: .18em;\n      font-weight: 900;\n      font-size: 18px;\n    }\n    .notice-body { padding: 34px; }\n    h1 {\n      margin: 0 0 18px;\n      color: #111;\n      font: 900 clamp(34px, 7vw, 74px) Arial, sans-serif;\n      line-height: .95;\n      letter-spacing: -.04em;\n      text-transform: uppercase;\n    }\n    .case { font: 700 13px Arial, sans-serif; letter-spacing: .12em; color: #52606f; text-transform: uppercase; }\n    p { font-size: 18px; line-height: 1.72; margin: 18px 0; }\n    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 28px; }\n    .card { border: 1px solid #d4d9df; background: #f7f9fb; padding: 16px; font-family: Arial, sans-serif; min-height: 110px; }\n    .card b { display: block; color: #8b1f28; text-transform: uppercase; font-size: 12px; letter-spacing: .12em; margin-bottom: 8px; }\n    .tiny { margin-top: 42px; text-align: center; color: #6b7280; font: 10px Arial, sans-serif; letter-spacing: .08em; }\n    .stamp { display: inline-block; border: 4px double #8b1f28; color: #8b1f28; padding: 10px 16px; transform: rotate(-2deg); font: 900 24px Arial, sans-serif; text-transform: uppercase; letter-spacing: .12em; margin: 12px 0 22px; }\n    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .topbar { align-items: flex-start; } }\n  </style>\n</head>\n<body>\n  <header class="topbar">\n    <div class="seal" aria-hidden="true">CIA</div>\n    <div class="agency-title">Central Intelligence Agency <small>Digital Evidence Custody Notice</small></div>\n  </header>\n  <main>\n    <section class="notice" aria-label="Seizure notice">\n      <div class="notice-head">Restricted archive control page</div>\n      <div class="notice-body">\n        <div class="case">Case File: ARC-NEMESIS / Public Access Suspended</div>\n        <h1>This repository has been seized</h1>\n        <div class="stamp">Access Revoked</div>\n        <p>The archive formerly available at <strong>repo.abyss.net/archive/nemesis-protocol</strong> is under lawful custody pending classification review, source-chain verification, and evidence contamination assessment.</p>\n        <p>Unauthorized copying, mirroring, indexing, or distribution of controlled national-security material may be logged, preserved, and referred to appropriate investigative authorities.</p>\n        <div class="grid">\n          <div class="card"><b>Custody Status</b>Repository image frozen. External object storage detached.</div>\n          <div class="card"><b>Access Window</b>Closed to public traffic. Prior tokens invalidated.</div>\n          <div class="card"><b>Advisory</b>Do not trust unofficial mirrors or derivative dumps.</div>\n        </div>\n        <div class="tiny">For information visit agency-records.archive.net</div>\n      </div>\n    </section>\n  </main>\n</body>\n</html>\n';

// src/websites/AbyssRepoWebsite.ts
var AbyssRepoWebsite = class extends import_hackhub_content_sdk17.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "Abyss Repository";
    this.Host = "repo.abyss.net";
    this.Icon = "";
    this.Popular = false;
    this.Pages = [
      {
        path: "/archive/nemesis-protocol",
        title: "Repository Seized | Abyss Repository",
        description: "Controlled archive custody notice for the Nemesis Protocol repository.",
        html: repo_abyss_seized_default,
        seo: true,
        search: ["repo abyss", "nemesis protocol archive", "marek repo", "seized repository"]
      },
      {
        path: "/",
        title: "Repository Seized | Abyss Repository",
        description: "Controlled archive custody notice for the Nemesis Protocol repository.",
        html: repo_abyss_seized_default,
        seo: false
      }
    ];
  }
};
AbyssRepoWebsite = __decorateClass([
  import_hackhub_content_sdk17.RegisterWebsite
], AbyssRepoWebsite);

// src/websites/AgencyRecordsWebsite.ts
var import_hackhub_content_sdk18 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/agency-records-home.html
var agency_records_home_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Agency Records Archive</title>\n  <style>\n    * { box-sizing: border-box; }\n    body {\n      margin: 0;\n      background: #f4f6f8;\n      color: #17212b;\n      font-family: Arial, Helvetica, sans-serif;\n    }\n    .govbar { height: 10px; background: linear-gradient(90deg, #162f57, #162f57 45%, #b32633 45%, #b32633); }\n    header {\n      background: #fff;\n      border-bottom: 1px solid #d7dde3;\n      padding: 24px 7vw;\n      display: flex;\n      align-items: center;\n      gap: 18px;\n    }\n    .mark {\n      width: 68px;\n      height: 68px;\n      border-radius: 50%;\n      border: 3px solid #b99b3f;\n      display: grid;\n      place-items: center;\n      background: #17365d;\n      color: #fff;\n      font-weight: 900;\n      letter-spacing: .08em;\n    }\n    .title h1 { margin: 0; color: #112d50; font-size: 26px; letter-spacing: -.02em; }\n    .title p { margin: 4px 0 0; color: #5c6976; font-size: 13px; }\n    nav { background: #17365d; color: #fff; padding: 0 7vw; display: flex; gap: 28px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }\n    nav span { padding: 14px 0; display: inline-block; }\n    main { max-width: 1180px; margin: 0 auto; padding: 34px 24px 56px; }\n    .hero { background: #fff; border: 1px solid #d7dde3; padding: 30px; display: grid; grid-template-columns: 1.4fr .8fr; gap: 26px; }\n    .hero h2 { margin: 0 0 12px; color: #112d50; font-size: 34px; }\n    .hero p { line-height: 1.65; color: #394754; font-size: 16px; }\n    .panel { background: #f9fbfd; border: 1px solid #d7dde3; padding: 20px; }\n    .panel h3 { margin: 0 0 12px; color: #b32633; font-size: 15px; text-transform: uppercase; letter-spacing: .08em; }\n    .announcements { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 22px; }\n    article { background: #fff; border: 1px solid #d7dde3; padding: 22px; min-height: 180px; }\n    article time { color: #667381; font-size: 12px; font-weight: 700; text-transform: uppercase; }\n    article h3 { color: #112d50; margin: 10px 0; font-size: 18px; }\n    article p { color: #4c5966; line-height: 1.55; font-size: 14px; }\n    footer { border-top: 1px solid #d7dde3; background: #fff; color: #667381; text-align: center; padding: 18px; font-size: 12px; }\n    @media (max-width: 860px) { .hero, .announcements { grid-template-columns: 1fr; } nav { overflow-x: auto; } }\n  </style>\n</head>\n<body>\n  <div class="govbar"></div>\n  <header>\n    <div class="mark" aria-hidden="true">ARA</div>\n    <div class="title">\n      <h1>Agency Records Archive</h1>\n      <p>Public information portal for historical holdings, declassification notices, and records access guidance.</p>\n    </div>\n  </header>\n  <nav aria-label="Agency navigation">\n    <span>Records</span><span>Reading Room</span><span>Notices</span><span>FOIA</span><span>Contact</span>\n  </nav>\n  <main>\n    <section class="hero">\n      <div>\n        <h2>Welcome to the Agency Records Archive</h2>\n        <p>This record portal provides summaries of released holdings, public advisory bulletins, and routine administrative notices. Some pages may be temporarily unavailable during catalog migration or classification review.</p>\n        <p>Visitors seeking seized-domain information should review current public notices and preserve any case reference numbers displayed on external custody pages.</p>\n      </div>\n      <aside class="panel">\n        <h3>Today&apos;s Service Status</h3>\n        <p><strong>Reading Room:</strong> Online<br /><strong>Digital Catalog:</strong> Delayed indexing<br /><strong>Records Request Desk:</strong> Standard queue</p>\n      </aside>\n    </section>\n    <section class="announcements" aria-label="Agency announcements">\n      <article>\n        <time>June 23, 2026</time>\n        <h3>Archive migration maintenance</h3>\n        <p>Selected finding aids may show duplicate reference numbers while legacy records are moved to the unified catalog.</p>\n      </article>\n      <article>\n        <time>June 18, 2026</time>\n        <h3>Public advisory: counterfeit custody notices</h3>\n        <p>The archive has received reports of altered seizure banners circulating through unofficial mirrors and relay indexes.</p>\n      </article>\n      <article>\n        <time>June 11, 2026</time>\n        <h3>New historical collection summaries</h3>\n        <p>Several mid-century technology-assessment collections have received updated summary pages and request instructions.</p>\n      </article>\n      <article>\n        <time>May 30, 2026</time>\n        <h3>Records request processing note</h3>\n        <p>Requests containing incomplete contact nodes may require additional identity verification before review.</p>\n      </article>\n      <article>\n        <time>May 16, 2026</time>\n        <h3>Reading room equipment update</h3>\n        <p>Microform stations in Rooms B and C will be offline during scheduled equipment calibration.</p>\n      </article>\n      <article>\n        <time>April 29, 2026</time>\n        <h3>Digital preservation bulletin</h3>\n        <p>Researchers are advised to cite stable archive identifiers rather than mirror URLs or relay-hosted copies.</p>\n      </article>\n    </section>\n  </main>\n  <footer>Agency Records Archive \xB7 Fictional public portal \xB7 Records notices are provided for simulation use.</footer>\n</body>\n</html>\n';

// src/websites/AgencyRecordsWebsite.ts
var AgencyRecordsWebsite = class extends import_hackhub_content_sdk18.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "Agency Records Archive";
    this.Host = "agency-records.archive.net";
    this.Icon = "";
    this.Popular = false;
    this.Pages = [
      {
        path: "/",
        title: "Agency Records Archive",
        description: "Fictional agency records portal with public notices and archive announcements.",
        html: agency_records_home_default,
        seo: true,
        search: ["agency records archive", "cia records", "public notices", "archive announcements"]
      }
    ];
  }
};
AgencyRecordsWebsite = __decorateClass([
  import_hackhub_content_sdk18.RegisterWebsite
], AgencyRecordsWebsite);

// src/websites/NemesisWebsite.ts
var import_hackhub_content_sdk19 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/nemesis-home.html
var nemesis_home_default = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nemesis Protocol</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #050608;
      --panel: rgba(11, 14, 18, 0.88);
      --line: rgba(184, 202, 222, 0.15);
      --text: #e9edf2;
      --muted: #9aa6b5;
      --accent: #b23d4a;
      --accent-soft: rgba(178, 61, 74, 0.16);
    }

    * { box-sizing: border-box; }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at 50% -20%, rgba(178, 61, 74, 0.14), transparent 36%),
        linear-gradient(180deg, #0a0c10 0%, var(--bg) 100%);
      color: var(--text);
      font-family: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    body {
      display: grid;
      place-items: center;
      padding: 34px 20px;
    }

    main {
      width: min(860px, 100%);
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--panel);
      box-shadow: 0 26px 80px rgba(0, 0, 0, 0.55);
      overflow: hidden;
    }

    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.025);
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .status::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }

    .content {
      padding: clamp(30px, 7vw, 68px);
    }

    h1 {
      margin: 0 0 20px;
      color: #f4f0ec;
      font-size: clamp(34px, 8vw, 76px);
      font-weight: 800;
      letter-spacing: 0.08em;
      line-height: 0.95;
      text-transform: uppercase;
    }

    .divider {
      width: 96px;
      height: 2px;
      margin: 0 0 24px;
      background: linear-gradient(90deg, var(--accent), transparent);
    }

    p {
      max-width: 660px;
      margin: 0;
      color: #cbd3dc;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: clamp(16px, 2vw, 19px);
      line-height: 1.72;
    }

    .footer-note {
      margin-top: 32px;
      padding: 13px 15px;
      border: 1px solid var(--line);
      border-radius: 12px;
      color: var(--muted);
      background: var(--accent-soft);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main>
    <div class="bar">
      <span>nemesis.net</span>
      <span class="status">public relay active</span>
    </div>
    <section class="content">
      <h1>Nemesis<br />Protocol</h1>
      <div class="divider"></div>
      <p>Hey, here is the final piece of my puzzle. If you liked it and you want to see more, make sure you mention it at the mod's post in discord. Thanks for playing my mod.</p>
      <div class="footer-note">archive signal complete</div>
    </section>
  </main>
</body>
</html>
`;

// src/websites/NemesisWebsite.ts
var NemesisWebsite = class extends import_hackhub_content_sdk19.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "Nemesis Protocol";
    this.Host = "nemesis.net";
    this.Icon = "";
    this.Popular = false;
    this.Pages = [
      {
        path: "/",
        title: "Nemesis Protocol",
        description: "Nemesis Protocol closing page.",
        html: nemesis_home_default,
        seo: true,
        search: ["nemesis protocol", "nemesis final piece"]
      }
    ];
  }
};
NemesisWebsite = __decorateClass([
  import_hackhub_content_sdk19.RegisterWebsite
], NemesisWebsite);

// src/websites/GoagleDriveWebsite.ts
var import_hackhub_content_sdk20 = require("@hotbunny/hackhub-content-sdk");

// src/websites/pages/goagle-drive-projects.html
var goagle_drive_projects_default = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>Project Pictures - Goagle Drive</title>\n  <style>\n    :root {\n      color-scheme: dark;\n      --bg: #0b0f14;\n      --panel: #111821;\n      --panel-2: #151f2b;\n      --panel-3: #1b2633;\n      --line: rgba(154, 180, 206, 0.16);\n      --text: #e6edf5;\n      --muted: #91a0ae;\n      --soft: #c3ced9;\n      --accent: #77a7ff;\n      --accent-2: #72e4d0;\n      --danger: #f87171;\n      --shadow: 0 22px 60px rgba(0, 0, 0, 0.46);\n    }\n\n    * { box-sizing: border-box; }\n\n    html,\n    body {\n      margin: 0;\n      min-height: 100%;\n      background:\n        radial-gradient(circle at 18% 0%, rgba(82, 118, 173, 0.16), transparent 30%),\n        linear-gradient(180deg, #0c1118 0%, #070a0f 100%);\n      color: var(--text);\n      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n    }\n\n    button {\n      font: inherit;\n      color: inherit;\n    }\n\n    .drive-shell {\n      min-height: 100vh;\n      display: grid;\n      grid-template-columns: 258px minmax(0, 1fr);\n    }\n\n    .sidebar {\n      position: sticky;\n      top: 0;\n      height: 100vh;\n      padding: 22px 16px;\n      background: rgba(9, 13, 19, 0.88);\n      border-right: 1px solid var(--line);\n      backdrop-filter: blur(18px);\n    }\n\n    .brand {\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      margin-bottom: 24px;\n      padding: 0 4px;\n    }\n\n    .brand-mark {\n      width: 34px;\n      height: 34px;\n      border-radius: 9px;\n      display: grid;\n      place-items: center;\n      background: linear-gradient(135deg, #30415b, #111a26 55%, #132d35);\n      border: 1px solid rgba(140, 180, 255, 0.24);\n      box-shadow: inset 0 0 22px rgba(114, 228, 208, 0.08);\n      font-weight: 800;\n      letter-spacing: -0.08em;\n    }\n\n    .brand strong {\n      display: block;\n      font-size: 15px;\n      letter-spacing: 0.02em;\n    }\n\n    .brand span {\n      display: block;\n      margin-top: 2px;\n      color: var(--muted);\n      font-size: 12px;\n    }\n\n    .nav-title {\n      margin: 18px 4px 9px;\n      color: #718195;\n      font-size: 11px;\n      font-weight: 700;\n      letter-spacing: 0.12em;\n      text-transform: uppercase;\n    }\n\n    .category-list {\n      display: grid;\n      gap: 6px;\n    }\n\n    .category-button {\n      width: 100%;\n      border: 1px solid transparent;\n      border-radius: 11px;\n      padding: 10px 12px;\n      background: transparent;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 10px;\n      cursor: pointer;\n      text-align: left;\n      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;\n    }\n\n    .category-button:hover,\n    .category-button.is-active {\n      background: rgba(119, 167, 255, 0.10);\n      border-color: rgba(119, 167, 255, 0.26);\n      transform: translateX(2px);\n    }\n\n    .category-name {\n      overflow: hidden;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n      font-size: 13px;\n    }\n\n    .category-count {\n      min-width: 24px;\n      height: 20px;\n      padding: 0 7px;\n      border-radius: 999px;\n      display: grid;\n      place-items: center;\n      color: var(--soft);\n      background: rgba(255, 255, 255, 0.07);\n      font-size: 11px;\n    }\n\n    .content {\n      padding: 24px 28px 38px;\n      min-width: 0;\n    }\n\n    .topbar {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 18px;\n      margin-bottom: 22px;\n    }\n\n    .crumbs {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 8px;\n      align-items: center;\n      color: var(--muted);\n      font-size: 13px;\n    }\n\n    .crumbs strong {\n      color: var(--text);\n      font-weight: 650;\n    }\n\n    .searchbar {\n      width: min(320px, 100%);\n      border: 1px solid var(--line);\n      border-radius: 12px;\n      background: rgba(255, 255, 255, 0.045);\n      color: var(--text);\n      padding: 10px 12px;\n      outline: none;\n      transition: border-color 150ms ease, background 150ms ease;\n    }\n\n    .searchbar:focus {\n      border-color: rgba(119, 167, 255, 0.55);\n      background: rgba(255, 255, 255, 0.07);\n    }\n\n    .folder-header {\n      border: 1px solid var(--line);\n      border-radius: 20px;\n      padding: 22px;\n      background: linear-gradient(135deg, rgba(21, 31, 43, 0.88), rgba(11, 15, 20, 0.88));\n      box-shadow: var(--shadow);\n      margin-bottom: 18px;\n    }\n\n    .folder-header h1 {\n      margin: 0 0 8px;\n      font-size: clamp(26px, 4vw, 40px);\n      letter-spacing: -0.04em;\n    }\n\n    .folder-header p {\n      max-width: 800px;\n      margin: 0;\n      color: var(--muted);\n      line-height: 1.58;\n      font-size: 14px;\n    }\n\n    .meta-strip {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 8px;\n      margin-top: 16px;\n    }\n\n    .pill {\n      border: 1px solid var(--line);\n      border-radius: 999px;\n      padding: 6px 10px;\n      color: var(--soft);\n      background: rgba(255, 255, 255, 0.04);\n      font-size: 12px;\n    }\n\n    .list-card {\n      border: 1px solid var(--line);\n      border-radius: 18px;\n      overflow: hidden;\n      background: rgba(12, 17, 24, 0.72);\n      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);\n    }\n\n    .list-head,\n    .file-row {\n      display: grid;\n      grid-template-columns: minmax(260px, 1fr) 144px 118px 120px;\n      gap: 14px;\n      align-items: center;\n      padding: 12px 16px;\n    }\n\n    .list-head {\n      color: #7e8c9d;\n      background: rgba(255, 255, 255, 0.035);\n      border-bottom: 1px solid var(--line);\n      font-size: 12px;\n      font-weight: 700;\n      letter-spacing: 0.08em;\n      text-transform: uppercase;\n    }\n\n    .file-row {\n      width: 100%;\n      border: 0;\n      border-bottom: 1px solid rgba(154, 180, 206, 0.09);\n      background: transparent;\n      cursor: pointer;\n      text-align: left;\n      transition: background 140ms ease, transform 140ms ease;\n    }\n\n    .file-row:last-child { border-bottom: 0; }\n\n    .file-row:hover,\n    .file-row:focus-visible {\n      background: rgba(119, 167, 255, 0.09);\n      transform: translateX(3px);\n      outline: none;\n    }\n\n    .file-main {\n      display: flex;\n      align-items: center;\n      min-width: 0;\n      gap: 12px;\n    }\n\n    .thumb {\n      width: 54px;\n      height: 42px;\n      border-radius: 9px;\n      flex: 0 0 auto;\n      object-fit: cover;\n      background: var(--panel-3);\n      border: 1px solid rgba(255, 255, 255, 0.12);\n    }\n\n    .file-title {\n      display: block;\n      overflow: hidden;\n      color: var(--text);\n      font-weight: 660;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    .file-subtitle {\n      display: block;\n      margin-top: 3px;\n      overflow: hidden;\n      color: var(--muted);\n      font-size: 12px;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n    }\n\n    .file-cell {\n      color: var(--muted);\n      font-size: 13px;\n    }\n\n    .viewer {\n      position: fixed;\n      inset: 0;\n      z-index: 50;\n      display: none;\n      grid-template-rows: auto minmax(0, 1fr);\n      background: #05070a;\n      opacity: 0;\n      transition: opacity 180ms ease;\n    }\n\n    .viewer.is-open {\n      display: grid;\n      opacity: 1;\n    }\n\n    .viewer-toolbar {\n      min-height: 62px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 12px;\n      padding: 12px 16px;\n      border-bottom: 1px solid var(--line);\n      background: rgba(10, 14, 19, 0.94);\n      backdrop-filter: blur(18px);\n    }\n\n    .viewer-title {\n      min-width: 0;\n    }\n\n    .viewer-title strong {\n      display: block;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      white-space: nowrap;\n      font-size: 14px;\n    }\n\n    .viewer-title span {\n      display: block;\n      margin-top: 2px;\n      color: var(--muted);\n      font-size: 12px;\n    }\n\n    .viewer-actions {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      flex-wrap: wrap;\n      justify-content: flex-end;\n    }\n\n    .control {\n      border: 1px solid var(--line);\n      border-radius: 10px;\n      padding: 8px 11px;\n      background: rgba(255, 255, 255, 0.055);\n      color: var(--soft);\n      cursor: pointer;\n      transition: background 140ms ease, border-color 140ms ease;\n    }\n\n    .control:hover {\n      background: rgba(119, 167, 255, 0.12);\n      border-color: rgba(119, 167, 255, 0.35);\n    }\n\n    .viewer-canvas {\n      overflow: auto;\n      display: grid;\n      place-items: center;\n      padding: 24px;\n      background:\n        linear-gradient(45deg, rgba(255,255,255,0.025) 25%, transparent 25%),\n        linear-gradient(-45deg, rgba(255,255,255,0.025) 25%, transparent 25%),\n        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.025) 75%),\n        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.025) 75%),\n        #05070a;\n      background-position: 0 0, 0 12px, 12px -12px, -12px 0;\n      background-size: 24px 24px;\n    }\n\n    .viewer-image {\n      max-width: 100%;\n      max-height: calc(100vh - 112px);\n      width: auto;\n      height: auto;\n      object-fit: contain;\n      border-radius: 4px;\n      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.58);\n      transition: width 120ms ease, max-width 120ms ease, max-height 120ms ease;\n    }\n\n    @media (max-width: 860px) {\n      .drive-shell { grid-template-columns: 1fr; }\n      .sidebar {\n        position: static;\n        height: auto;\n        border-right: 0;\n        border-bottom: 1px solid var(--line);\n      }\n      .category-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n      .topbar { align-items: flex-start; flex-direction: column; }\n      .list-head { display: none; }\n      .file-row { grid-template-columns: 1fr; gap: 8px; }\n      .file-cell { padding-left: 66px; }\n    }\n  </style>\n</head>\n<body>\n  <div class="drive-shell">\n    <aside class="sidebar" aria-label="Drive folders">\n      <div class="brand">\n        <div class="brand-mark">G</div>\n        <div>\n          <strong>Goagle Drive</strong>\n          <span>Shared evidence archive</span>\n        </div>\n      </div>\n\n      <div class="nav-title">Project folders</div>\n      <div class="category-list" id="categoryList"></div>\n    </aside>\n\n    <main class="content">\n      <div class="topbar">\n        <div class="crumbs"><span>My Drive</span><span>/</span><strong>Project Pictures</strong><span>/</span><strong id="activeCrumb">icewall_meridian</strong></div>\n        <input class="searchbar" id="searchInput" placeholder="Search current folder" autocomplete="off" />\n      </div>\n\n      <section class="folder-header">\n        <h1 id="folderTitle">icewall_meridian</h1>\n        <p id="folderDescription">Project image files recovered from the icewall_meridian directory.</p>\n        <div class="meta-strip">\n          <span class="pill" id="fileCount">7 images</span>\n          <span class="pill">Owner: L. Marek</span>\n          <span class="pill">Access: view only</span>\n          <span class="pill">Shared by link</span>\n        </div>\n      </section>\n\n      <section class="list-card" aria-label="Picture list">\n        <div class="list-head">\n          <span>Name</span>\n          <span>Project</span>\n          <span>Type</span>\n          <span>Modified</span>\n        </div>\n        <div id="fileList"></div>\n      </section>\n    </main>\n  </div>\n\n  <section class="viewer" id="viewer" aria-label="Image viewer" aria-hidden="true">\n    <div class="viewer-toolbar">\n      <div class="viewer-title">\n        <strong id="viewerName">Image</strong>\n        <span id="viewerMeta">100%</span>\n      </div>\n      <div class="viewer-actions">\n        <button class="control" id="zoomOut" type="button">- Zoom</button>\n        <button class="control" id="zoomReset" type="button">Fit</button>\n        <button class="control" id="zoomIn" type="button">+ Zoom</button>\n        <button class="control" id="returnList" type="button">Return to list</button>\n      </div>\n    </div>\n    <div class="viewer-canvas" id="viewerCanvas">\n      <img class="viewer-image" id="viewerImage" alt="Selected project picture" />\n    </div>\n  </section>\n\n  <script>\n    const ASSET_ROOT = "mod-asset://nemesis-protocol-stage1/apps/mariana-browser/assets/projects/";\n\n    const projects = [\n      {\n        id: "icewall_meridian",\n        label: "icewall_meridian",\n        description: "Project image files recovered from the icewall_meridian directory.",\n        files: [{ name: "01.png", src: ASSET_ROOT + "icewall_meridian/01.png", type: "PNG image", modified: "2026-06-24" }, { name: "02.png", src: ASSET_ROOT + "icewall_meridian/02.png", type: "PNG image", modified: "2026-06-24" }, { name: "03.png", src: ASSET_ROOT + "icewall_meridian/03.png", type: "PNG image", modified: "2026-06-24" }, { name: "04.png", src: ASSET_ROOT + "icewall_meridian/04.png", type: "PNG image", modified: "2026-06-24" }, { name: "excavation_tents.png", src: ASSET_ROOT + "icewall_meridian/excavation_tents.png", type: "PNG image", modified: "2026-06-24" }, { name: "geometric_void.png", src: ASSET_ROOT + "icewall_meridian/geometric_void.png", type: "PNG image", modified: "2026-06-24" }, { name: "radar_sled_convoy.png", src: ASSET_ROOT + "icewall_meridian/radar_sled_convoy.png", type: "PNG image", modified: "2026-06-24" }]\n      },\n      {\n        id: "janus_gate",\n        label: "janus_gate",\n        description: "Project image files recovered from the janus_gate directory.",\n        files: [{ name: "01_signal_array_control_room.png", src: ASSET_ROOT + "janus_gate/01_signal_array_control_room.png", type: "PNG image", modified: "2026-06-24" }, { name: "02_gravitational_lensing_board.png", src: ASSET_ROOT + "janus_gate/02_gravitational_lensing_board.png", type: "PNG image", modified: "2026-06-24" }, { name: "03_archive_report_review.png", src: ASSET_ROOT + "janus_gate/03_archive_report_review.png", type: "PNG image", modified: "2026-06-24" }, { name: "04_deep_signal_control_room.png", src: ASSET_ROOT + "janus_gate/04_deep_signal_control_room.png", type: "PNG image", modified: "2026-06-24" }, { name: "05_site_c_restricted_sign.png", src: ASSET_ROOT + "janus_gate/05_site_c_restricted_sign.png", type: "PNG image", modified: "2026-06-24" }, { name: "06_phase_correction_workbench.png", src: ASSET_ROOT + "janus_gate/06_phase_correction_workbench.png", type: "PNG image", modified: "2026-06-24" }]\n      },\n      {\n        id: "operation_nemesis",\n        label: "operation_nemesis",\n        description: "Project image files recovered from the operation_nemesis directory.",\n        files: [{ name: "archive_access.png", src: ASSET_ROOT + "operation_nemesis/archive_access.png", type: "PNG image", modified: "2026-06-24" }, { name: "cctv_unknown.png", src: ASSET_ROOT + "operation_nemesis/cctv_unknown.png", type: "PNG image", modified: "2026-06-24" }, { name: "document_crates.png", src: ASSET_ROOT + "operation_nemesis/document_crates.png", type: "PNG image", modified: "2026-06-24" }, { name: "hdrive.png", src: ASSET_ROOT + "operation_nemesis/hdrive.png", type: "PNG image", modified: "2026-06-24" }, { name: "room_term.png", src: ASSET_ROOT + "operation_nemesis/room_term.png", type: "PNG image", modified: "2026-06-24" }, { name: "sticker.png", src: ASSET_ROOT + "operation_nemesis/sticker.png", type: "PNG image", modified: "2026-06-24" }, { name: "term_mon.png", src: ASSET_ROOT + "operation_nemesis/term_mon.png", type: "PNG image", modified: "2026-06-24" }, { name: "warehouse.png", src: ASSET_ROOT + "operation_nemesis/warehouse.png", type: "PNG image", modified: "2026-06-24" }, { name: "zurich.png", src: ASSET_ROOT + "operation_nemesis/zurich.png", type: "PNG image", modified: "2026-06-24" }]\n      },\n      {\n        id: "aurora_veil",\n        label: "aurora_veil",\n        description: "Project image files recovered from the aurora_veil directory.",\n        files: [{ name: "07.png", src: ASSET_ROOT + "aurora_veil/07.png", type: "PNG image", modified: "2026-06-24" }, { name: "09_satellite_dish_startrails.png", src: ASSET_ROOT + "aurora_veil/09_satellite_dish_startrails.png", type: "PNG image", modified: "2026-06-24" }, { name: "aerosol_canisters.png", src: ASSET_ROOT + "aurora_veil/aerosol_canisters.png", type: "PNG image", modified: "2026-06-24" }, { name: "aerosol_samples.png", src: ASSET_ROOT + "aurora_veil/aerosol_samples.png", type: "PNG image", modified: "2026-06-24" }, { name: "monitoring_station_aurora.png", src: ASSET_ROOT + "aurora_veil/monitoring_station_aurora.png", type: "PNG image", modified: "2026-06-24" }, { name: "rooftop_sensor_array.png", src: ASSET_ROOT + "aurora_veil/rooftop_sensor_array.png", type: "PNG image", modified: "2026-06-24" }, { name: "sensor_closeup.png", src: ASSET_ROOT + "aurora_veil/sensor_closeup.png", type: "PNG image", modified: "2026-06-24" }, { name: "station_log.png", src: ASSET_ROOT + "aurora_veil/station_log.png", type: "PNG image", modified: "2026-06-24" }, { name: "weather_balloon_launch.png", src: ASSET_ROOT + "aurora_veil/weather_balloon_launch.png", type: "PNG image", modified: "2026-06-24" }]\n      },\n      {\n        id: "black_ice_bioreservoir",\n        label: "black_ice_bioreservoir",\n        description: "Project image files recovered from the black_ice_bioreservoir directory.",\n        files: [{ name: "analysis.png", src: ASSET_ROOT + "black_ice_bioreservoir/analysis.png", type: "PNG image", modified: "2026-06-24" }, { name: "classified_doss.png", src: ASSET_ROOT + "black_ice_bioreservoir/classified_doss.png", type: "PNG image", modified: "2026-06-24" }, { name: "frozen.png", src: ASSET_ROOT + "black_ice_bioreservoir/frozen.png", type: "PNG image", modified: "2026-06-24" }, { name: "ice_core.png", src: ASSET_ROOT + "black_ice_bioreservoir/ice_core.png", type: "PNG image", modified: "2026-06-24" }, { name: "sealed.png", src: ASSET_ROOT + "black_ice_bioreservoir/sealed.png", type: "PNG image", modified: "2026-06-24" }, { name: "specimen_v.png", src: ASSET_ROOT + "black_ice_bioreservoir/specimen_v.png", type: "PNG image", modified: "2026-06-24" }]\n      },\n      {\n        id: "chronos_lattice",\n        label: "chronos_lattice",\n        description: "Project image files recovered from the chronos_lattice directory.",\n        files: [{ name: "archive_box.png", src: ASSET_ROOT + "chronos_lattice/archive_box.png", type: "PNG image", modified: "2026-06-24" }, { name: "classified_dossier.png", src: ASSET_ROOT + "chronos_lattice/classified_dossier.png", type: "PNG image", modified: "2026-06-24" }, { name: "control_ter.png", src: ASSET_ROOT + "chronos_lattice/control_ter.png", type: "PNG image", modified: "2026-06-24" }, { name: "coolant.png", src: ASSET_ROOT + "chronos_lattice/coolant.png", type: "PNG image", modified: "2026-06-24" }, { name: "core_tunnel.png", src: ASSET_ROOT + "chronos_lattice/core_tunnel.png", type: "PNG image", modified: "2026-06-24" }, { name: "lab_bench.png", src: ASSET_ROOT + "chronos_lattice/lab_bench.png", type: "PNG image", modified: "2026-06-24" }, { name: "phase_whiteboard.png", src: ASSET_ROOT + "chronos_lattice/phase_whiteboard.png", type: "PNG image", modified: "2026-06-24" }]\n      }\n    ];\n\n    const categoryList = document.getElementById("categoryList");\n    const fileList = document.getElementById("fileList");\n    const folderTitle = document.getElementById("folderTitle");\n    const folderDescription = document.getElementById("folderDescription");\n    const activeCrumb = document.getElementById("activeCrumb");\n    const fileCount = document.getElementById("fileCount");\n    const searchInput = document.getElementById("searchInput");\n    const viewer = document.getElementById("viewer");\n    const viewerImage = document.getElementById("viewerImage");\n    const viewerName = document.getElementById("viewerName");\n    const viewerMeta = document.getElementById("viewerMeta");\n    const returnList = document.getElementById("returnList");\n    const zoomIn = document.getElementById("zoomIn");\n    const zoomOut = document.getElementById("zoomOut");\n    const zoomReset = document.getElementById("zoomReset");\n\n    let activeProject = projects[0];\n    let zoom = 1;\n\n    function setActiveProject(project) {\n      activeProject = project;\n      searchInput.value = "";\n      renderCategories();\n      renderFiles();\n    }\n\n    function renderCategories() {\n      categoryList.innerHTML = "";\n      projects.forEach((project) => {\n        const button = document.createElement("button");\n        button.type = "button";\n        button.className = "category-button" + (project.id === activeProject.id ? " is-active" : "");\n        button.innerHTML = `<span class="category-name">${project.label}</span><span class="category-count">${project.files.length}</span>`;\n        button.addEventListener("click", () => setActiveProject(project));\n        categoryList.appendChild(button);\n      });\n    }\n\n    function renderFiles() {\n      const query = searchInput.value.trim().toLowerCase();\n      const files = activeProject.files.filter((file) => file.name.toLowerCase().includes(query));\n\n      folderTitle.textContent = activeProject.label;\n      folderDescription.textContent = activeProject.description;\n      activeCrumb.textContent = activeProject.label;\n      fileCount.textContent = files.length === 1 ? "1 image" : files.length + " images";\n      fileList.innerHTML = "";\n\n      files.forEach((file) => {\n        const row = document.createElement("button");\n        row.type = "button";\n        row.className = "file-row";\n        row.innerHTML = `\n          <span class="file-main">\n            <img class="thumb" src="${file.src}" alt="" loading="lazy" />\n            <span>\n              <span class="file-title">${file.name}</span>\n              <span class="file-subtitle">Click to open full image viewer</span>\n            </span>\n          </span>\n          <span class="file-cell">${activeProject.label}</span>\n          <span class="file-cell">${file.type}</span>\n          <span class="file-cell">${file.modified}</span>\n        `;\n        row.addEventListener("click", () => openViewer(file));\n        fileList.appendChild(row);\n      });\n    }\n\n    function openViewer(file) {\n      zoom = 1;\n      viewerImage.src = file.src;\n      viewerImage.alt = file.name;\n      viewerName.textContent = file.name;\n      applyFitView();\n      viewer.classList.add("is-open");\n      viewer.setAttribute("aria-hidden", "false");\n    }\n\n    function closeViewer() {\n      viewer.classList.remove("is-open");\n      viewer.setAttribute("aria-hidden", "true");\n      viewerImage.removeAttribute("src");\n    }\n\n    function applyFitView() {\n      zoom = 1;\n      viewerImage.style.maxWidth = "100%";\n      viewerImage.style.maxHeight = "calc(100vh - 112px)";\n      viewerImage.style.width = "auto";\n      viewerMeta.textContent = "Fit view - use zoom controls for pixel inspection";\n    }\n\n    function applyZoom(nextZoom) {\n      zoom = Math.max(0.5, Math.min(4, nextZoom));\n      const naturalWidth = viewerImage.naturalWidth || 1200;\n      viewerImage.style.maxWidth = "none";\n      viewerImage.style.maxHeight = "none";\n      viewerImage.style.width = Math.round(naturalWidth * zoom) + "px";\n      viewerMeta.textContent = Math.round(zoom * 100) + "% actual pixels";\n    }\n\n    searchInput.addEventListener("input", renderFiles);\n    returnList.addEventListener("click", closeViewer);\n    zoomIn.addEventListener("click", () => applyZoom(zoom + 0.25));\n    zoomOut.addEventListener("click", () => applyZoom(zoom - 0.25));\n    zoomReset.addEventListener("click", applyFitView);\n\n    document.addEventListener("keydown", (event) => {\n      if (event.key === "Escape" && viewer.classList.contains("is-open")) {\n        closeViewer();\n      }\n    });\n\n    renderCategories();\n    renderFiles();\n  </script>\n</body>\n</html>\n';

// src/websites/GoagleDriveWebsite.ts
var DRIVE_FOLDER_PATH = "/drive/folders/1QdK9vX2rL0nA4cF8pZsT6yE3hB7mNwR5t";
var GoagleDriveWebsite = class extends import_hackhub_content_sdk20.Website {
  constructor() {
    super(...arguments);
    this.SiteName = "Goagle Drive";
    this.Host = "drive.goagle.net";
    this.Icon = "";
    this.Popular = false;
    this.Pages = [
      {
        path: DRIVE_FOLDER_PATH,
        title: "Project Pictures - Goagle Drive",
        description: "Shared project picture archive for Nemesis Protocol evidence material.",
        html: goagle_drive_projects_default,
        seo: true,
        search: [
          "goagle drive",
          "project pictures",
          "aurora veil",
          "black ice bioreservoir",
          "chronos lattice",
          "icewall meridian",
          "janus gate",
          "operation nemesis"
        ]
      },
      {
        path: DRIVE_FOLDER_PATH + "/",
        title: "Project Pictures - Goagle Drive",
        description: "Shared project picture archive for Nemesis Protocol evidence material.",
        html: goagle_drive_projects_default,
        seo: false
      }
    ];
  }
};
GoagleDriveWebsite = __decorateClass([
  import_hackhub_content_sdk20.RegisterWebsite
], GoagleDriveWebsite);

// src/apps/MarianaBrowserApp.ts
var import_hackhub_content_sdk21 = require("@hotbunny/hackhub-content-sdk");

// src/apps/mariana-browser.html
var mariana_browser_default = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Ark</title>\n  <link rel="icon" href="mod-asset://nemesis-protocol-stage1/apps/mariana-browser/assets/mariana-browser-favicon.png" />\n  <style>\n    :root {\n      color-scheme: dark;\n      --bg: #020407;\n      --panel: #071018;\n      --panel-2: #0b151d;\n      --panel-3: #0e1b24;\n      --edge: rgba(50, 255, 222, 0.22);\n      --edge-strong: rgba(50, 255, 222, 0.5);\n      --edge-soft: rgba(50, 255, 222, 0.1);\n      --text: #d7fff8;\n      --text-soft: #b3d5d1;\n      --muted: #6f8e91;\n      --accent: #34f7d5;\n      --accent-2: #8dfcf0;\n      --error: #ff5f78;\n      --warning: #f7d76e;\n      --black: #000;\n    }\n\n    * { box-sizing: border-box; }\n\n    html,\n    body {\n      margin: 0;\n      width: 100%;\n      height: 100%;\n      overflow: hidden;\n      background: var(--bg);\n      color: var(--text);\n      font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;\n      font-size: 13px;\n    }\n\n    body {\n      display: flex;\n      flex-direction: column;\n      border: 1px solid rgba(52, 247, 213, 0.16);\n      box-shadow: inset 0 0 50px rgba(52, 247, 213, 0.04);\n    }\n\n    button,\n    input { font: inherit; }\n\n    .chrome {\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      padding: 10px 12px;\n      background:\n        linear-gradient(180deg, rgba(16, 31, 41, 0.98), rgba(8, 13, 18, 0.98)),\n        radial-gradient(circle at 20% 0%, rgba(52, 247, 213, 0.12), transparent 32%);\n      border-bottom: 1px solid var(--edge);\n    }\n\n    .brand {\n      display: flex;\n      align-items: center;\n      gap: 9px;\n      min-width: 214px;\n      letter-spacing: 0.08em;\n      color: var(--accent);\n      font-weight: 800;\n      white-space: nowrap;\n      text-shadow: 0 0 14px rgba(52, 247, 213, 0.18);\n    }\n\n    .brand img {\n      width: 24px;\n      height: 24px;\n      filter: drop-shadow(0 0 8px rgba(52, 247, 213, 0.35));\n    }\n\n    .nav {\n      display: flex;\n      gap: 6px;\n    }\n\n    .nav button,\n    .go {\n      border: 1px solid var(--edge);\n      background: rgba(52, 247, 213, 0.05);\n      color: var(--text);\n      min-width: 34px;\n      height: 34px;\n      border-radius: 7px;\n      cursor: pointer;\n    }\n\n    .nav button:hover,\n    .go:hover {\n      background: rgba(52, 247, 213, 0.12);\n    }\n\n    .address {\n      flex: 1;\n      height: 36px;\n      border-radius: 8px;\n      border: 1px solid var(--edge);\n      background: #03070b;\n      color: var(--text);\n      outline: none;\n      padding: 0 14px;\n      box-shadow: inset 0 0 22px rgba(52, 247, 213, 0.05);\n    }\n\n    .address::placeholder { color: #49676b; }\n\n    .statusbar {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      min-height: 26px;\n      padding: 0 12px;\n      background: #05090d;\n      color: var(--muted);\n      border-bottom: 1px solid var(--edge-soft);\n      font-size: 11px;\n    }\n\n    .status-online { color: var(--accent); }\n    .status-offline { color: var(--error); }\n\n    .viewport {\n      position: relative;\n      flex: 1;\n      background: #000;\n      overflow: hidden;\n    }\n\n    .empty-hint {\n      position: absolute;\n      inset: 0;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      color: rgba(215, 255, 248, 0.26);\n      letter-spacing: 0.2em;\n      text-transform: uppercase;\n      user-select: none;\n      pointer-events: none;\n    }\n\n    .error-layer {\n      position: absolute;\n      inset: 0;\n      display: none;\n      align-items: center;\n      justify-content: center;\n      background:\n        radial-gradient(circle at center, rgba(255, 95, 120, 0.08), transparent 36%),\n        #000;\n      padding: 32px;\n      z-index: 6;\n    }\n\n    .error-box {\n      min-width: 360px;\n      max-width: 520px;\n      border: 1px solid rgba(255, 95, 120, 0.42);\n      background: rgba(9, 5, 9, 0.96);\n      box-shadow: 0 0 60px rgba(255, 95, 120, 0.08);\n      border-radius: 12px;\n      padding: 24px;\n      text-align: center;\n    }\n\n    .error-title {\n      color: var(--error);\n      font-weight: 800;\n      letter-spacing: 0.18em;\n      text-transform: uppercase;\n      margin-bottom: 12px;\n    }\n\n    .error-message {\n      color: #ffe0e5;\n      font-size: 15px;\n    }\n\n    .site {\n      position: absolute;\n      inset: 0;\n      display: none;\n      background:\n        radial-gradient(circle at top left, rgba(52, 247, 213, 0.08), transparent 28%),\n        radial-gradient(circle at 80% 120%, rgba(72, 106, 255, 0.08), transparent 34%),\n        #010305;\n      overflow: hidden;\n    }\n\n    .login-wrap {\n      height: 100%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 30px;\n    }\n\n    .login-panel {\n      width: min(440px, 100%);\n      border: 1px solid var(--edge);\n      background: rgba(7, 16, 24, 0.96);\n      border-radius: 16px;\n      padding: 28px;\n      box-shadow: 0 0 80px rgba(52, 247, 213, 0.09);\n    }\n\n    .login-kicker {\n      color: var(--muted);\n      font-size: 11px;\n      letter-spacing: 0.24em;\n      text-transform: uppercase;\n      margin-bottom: 10px;\n    }\n\n    .login-title {\n      font-size: 28px;\n      letter-spacing: 0.16em;\n      color: var(--accent-2);\n      margin: 0 0 10px;\n      text-transform: uppercase;\n    }\n\n    .login-copy {\n      color: var(--text-soft);\n      line-height: 1.7;\n      margin: 0 0 22px;\n    }\n\n    .field {\n      display: flex;\n      flex-direction: column;\n      gap: 7px;\n      margin-bottom: 14px;\n    }\n\n    .field label {\n      color: var(--muted);\n      text-transform: uppercase;\n      letter-spacing: 0.16em;\n      font-size: 11px;\n    }\n\n    .field input {\n      height: 40px;\n      border: 1px solid var(--edge);\n      border-radius: 8px;\n      background: #02070b;\n      color: var(--text);\n      outline: none;\n      padding: 0 12px;\n    }\n\n    .login-submit {\n      width: 100%;\n      height: 42px;\n      border: 1px solid var(--edge-strong);\n      border-radius: 8px;\n      background: linear-gradient(180deg, rgba(52, 247, 213, 0.16), rgba(52, 247, 213, 0.06));\n      color: var(--text);\n      cursor: pointer;\n      text-transform: uppercase;\n      letter-spacing: 0.16em;\n      font-weight: 800;\n    }\n\n    .login-submit:hover { background: rgba(52, 247, 213, 0.18); }\n\n    .login-error {\n      min-height: 20px;\n      margin-top: 14px;\n      color: var(--error);\n      text-align: center;\n      font-weight: 700;\n    }\n\n    .repo {\n      height: 100%;\n      display: none;\n      grid-template-columns: 240px 1fr;\n      grid-template-rows: 44px auto 1fr;\n      background: #030608;\n    }\n\n    .repo-top {\n      grid-column: 1 / -1;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 0 16px;\n      border-bottom: 1px solid var(--edge-soft);\n      background: linear-gradient(180deg, #0a131a, #05090d);\n      color: var(--text-soft);\n    }\n\n    .logged-in {\n      color: var(--accent);\n      font-weight: 800;\n    }\n\n    .repo-meta {\n      color: var(--muted);\n      font-size: 11px;\n      letter-spacing: 0.12em;\n      text-transform: uppercase;\n    }\n\n    .repo-alert {\n      grid-column: 1 / -1;\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      padding: 11px 16px;\n      border-bottom: 1px solid rgba(247, 215, 110, 0.22);\n      background:\n        linear-gradient(90deg, rgba(247, 215, 110, 0.13), rgba(52, 247, 213, 0.04)),\n        #070b0c;\n      color: #ffeaa6;\n      font-size: 12px;\n      line-height: 1.45;\n      letter-spacing: 0.04em;\n    }\n\n    .repo-alert-label {\n      color: var(--warning);\n      font-weight: 900;\n      text-transform: uppercase;\n      letter-spacing: 0.16em;\n      white-space: nowrap;\n    }\n\n    .repo-alert-link {\n      color: #fff5c7;\n      font-weight: 800;\n    }\n\n    .sidebar {\n      grid-row: 3;\n      border-right: 1px solid var(--edge-soft);\n      background: #050b10;\n      overflow-y: auto;\n      padding: 12px;\n    }\n\n    .sidebar-title {\n      color: var(--muted);\n      font-size: 11px;\n      letter-spacing: 0.16em;\n      text-transform: uppercase;\n      margin: 4px 4px 10px;\n    }\n\n    .dir-button {\n      width: 100%;\n      display: flex;\n      align-items: center;\n      gap: 9px;\n      border: 1px solid transparent;\n      border-radius: 8px;\n      background: transparent;\n      color: var(--text-soft);\n      padding: 10px 9px;\n      cursor: pointer;\n      text-align: left;\n      margin-bottom: 4px;\n      font-size: 12px;\n    }\n\n    .dir-button::before {\n      content: "\u25B8";\n      color: var(--accent);\n      opacity: 0.8;\n    }\n\n    .dir-button:hover {\n      border-color: var(--edge-soft);\n      background: rgba(52, 247, 213, 0.05);\n    }\n\n    .dir-button.active {\n      border-color: var(--edge);\n      color: var(--accent-2);\n      background: rgba(52, 247, 213, 0.09);\n    }\n\n    .preview {\n      grid-row: 3;\n      position: relative;\n      overflow-y: auto;\n      padding: 34px;\n      background:\n        linear-gradient(90deg, rgba(52, 247, 213, 0.035) 1px, transparent 1px),\n        linear-gradient(180deg, rgba(52, 247, 213, 0.025) 1px, transparent 1px),\n        #020507;\n      background-size: 42px 42px;\n    }\n\n    .preview-inner {\n      max-width: 900px;\n      margin: 0 auto;\n      min-height: 100%;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      text-align: center;\n    }\n\n    .preview-title {\n      margin: 0 0 16px;\n      color: #f3fffd;\n      letter-spacing: 0.18em;\n      text-transform: uppercase;\n      font-size: clamp(26px, 3.2vw, 46px);\n      line-height: 1.1;\n      text-shadow: 0 0 22px rgba(52, 247, 213, 0.16);\n    }\n\n    .main-title {\n      margin-top: 60px;\n      font-size: clamp(34px, 5vw, 68px);\n    }\n\n    .main-subtitle {\n      margin: 0 0 24px;\n      color: var(--accent-2);\n      font-size: 13px;\n      letter-spacing: 0.16em;\n      text-transform: uppercase;\n    }\n\n    .project-image {\n      width: min(330px, 88%);\n      aspect-ratio: 2 / 3;\n      object-fit: cover;\n      border: 1px solid var(--edge);\n      border-radius: 10px;\n      margin: 4px 0 24px;\n      box-shadow: 0 0 48px rgba(52, 247, 213, 0.1);\n      cursor: zoom-in;\n      transition: transform 140ms ease, border-color 140ms ease;\n    }\n\n    .project-image:hover {\n      transform: translateY(-2px);\n      border-color: var(--edge-strong);\n    }\n\n    .description {\n      max-width: 820px;\n      color: var(--text-soft);\n      line-height: 1.85;\n      font-size: 14px;\n      white-space: pre-line;\n      text-align: left;\n      background: rgba(4, 10, 14, 0.72);\n      border: 1px solid var(--edge-soft);\n      border-radius: 14px;\n      padding: 22px;\n    }\n\n    .main-description {\n      text-align: left;\n    }\n\n    .modal {\n      position: absolute;\n      inset: 0;\n      z-index: 10;\n      display: none;\n      flex-direction: column;\n      background: rgba(0, 0, 0, 0.96);\n    }\n\n    .modal-toolbar {\n      height: 46px;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 0 14px;\n      border-bottom: 1px solid var(--edge-soft);\n      background: #05090d;\n    }\n\n    .modal-title {\n      color: var(--accent);\n      letter-spacing: 0.12em;\n      text-transform: uppercase;\n      font-size: 12px;\n    }\n\n    .modal-actions {\n      display: flex;\n      gap: 8px;\n    }\n\n    .modal-actions button {\n      border: 1px solid var(--edge);\n      background: rgba(52, 247, 213, 0.06);\n      color: var(--text);\n      border-radius: 7px;\n      height: 32px;\n      min-width: 72px;\n      cursor: pointer;\n    }\n\n    .modal-stage {\n      flex: 1;\n      overflow: auto;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 28px;\n    }\n\n    .modal-stage img {\n      max-width: 92%;\n      max-height: 92%;\n      object-fit: contain;\n      transform-origin: center center;\n      border: 1px solid var(--edge-soft);\n      box-shadow: 0 0 70px rgba(52, 247, 213, 0.09);\n    }\n\n    .scanline {\n      pointer-events: none;\n      position: absolute;\n      inset: 0;\n      background: repeating-linear-gradient(\n        180deg,\n        rgba(255, 255, 255, 0.025) 0,\n        rgba(255, 255, 255, 0.025) 1px,\n        transparent 1px,\n        transparent 4px\n      );\n      mix-blend-mode: screen;\n      opacity: 0.16;\n      z-index: 20;\n    }\n  </style>\n</head>\n<body>\n  <div class="chrome">\n    <div class="brand">\n      <img src="mod-asset://nemesis-protocol-stage1/apps/mariana-browser/assets/mariana-browser-icon.png" alt="" />\n      <span>Ark</span>\n    </div>\n    <div class="nav" aria-hidden="true">\n      <button type="button" title="Back">\u2039</button>\n      <button type="button" title="Forward">\u203A</button>\n      <button type="button" title="Reload" id="reload">\u27F3</button>\n    </div>\n    <input id="address" class="address" autocomplete="off" spellcheck="false" placeholder="enter mari:// route" />\n    <button type="button" class="go" id="go">GO</button>\n  </div>\n\n  <div class="statusbar">\n    <span id="statusText">route: unknown</span>\n    <span>ARK / HADAL ROUTING INTERFACE</span>\n  </div>\n\n  <main class="viewport">\n    <div id="hint" class="empty-hint">awaiting route</div>\n\n    <section id="site" class="site">\n      <div id="loginView" class="login-wrap">\n        <form id="loginForm" class="login-panel" autocomplete="off" onsubmit="event.preventDefault(); if (window.arkAuthenticate) window.arkAuthenticate(); return false;">\n          <div class="login-kicker">mari://index_nemesis.entry.hadal</div>\n          <h1 class="login-title">Restricted Index</h1>\n          <p class="login-copy">This cabinet requires a Mariana route and authorized archive credentials.</p>\n          <div class="field">\n            <label for="username">Username</label>\n            <input id="username" name="username" autocomplete="off" spellcheck="false" onkeydown="if (event.key === \'Enter\') { event.preventDefault(); if (window.arkAuthenticate) window.arkAuthenticate(); }" />\n          </div>\n          <div class="field">\n            <label for="password">Password</label>\n            <input id="password" name="password" type="password" autocomplete="off" spellcheck="false" onkeydown="if (event.key === \'Enter\') { event.preventDefault(); if (window.arkAuthenticate) window.arkAuthenticate(); }" />\n          </div>\n          <button id="loginSubmit" class="login-submit" type="button" onclick="if (window.arkAuthenticate) window.arkAuthenticate();">Authenticate</button>\n          <div id="loginError" class="login-error" aria-live="polite"></div>\n        </form>\n      </div>\n\n      <div id="repoView" class="repo">\n        <header class="repo-top">\n          <span class="logged-in">Logged in as marekrev</span>\n          <span class="repo-meta">repository // nemesis protocol // hadal mirror</span>\n        </header>\n        <div class="repo-alert" role="note">\n          <span class="repo-alert-label">Update</span>\n          <span>The data have been updated, encrypted and stored at marek\'s repo <span class="repo-alert-link">https://repo.abyss.net/archive/nemesis-protocol</span></span>\n        </div>\n        <aside class="sidebar">\n          <div class="sidebar-title">Directories</div>\n          <div id="directoryList"></div>\n        </aside>\n        <section id="preview" class="preview">\n          <div class="preview-inner">\n            <h2 id="previewTitle" class="preview-title"></h2>\n            <img id="projectImage" class="project-image" alt="" />\n            <p id="mainSubtitle" class="main-subtitle"></p>\n            <div id="previewDescription" class="description"></div>\n          </div>\n        </section>\n      </div>\n\n      <div id="imageModal" class="modal" aria-hidden="true">\n        <div class="modal-toolbar">\n          <div id="modalTitle" class="modal-title"></div>\n          <div class="modal-actions">\n            <button type="button" id="zoomOut">Zoom -</button>\n            <button type="button" id="zoomIn">Zoom +</button>\n            <button type="button" id="closeModal">Return</button>\n          </div>\n        </div>\n        <div class="modal-stage">\n          <img id="modalImage" alt="" />\n        </div>\n      </div>\n    </section>\n\n    <div id="errorLayer" class="error-layer" role="alert" aria-live="assertive">\n      <div class="error-box">\n        <div class="error-title">Browser Error</div>\n        <div class="error-message" id="errorMessage">No active route has been found</div>\n      </div>\n    </div>\n    <div class="scanline"></div>\n  </main>\n\n  <script>\n    const exportsApi = window.ModExports || window;\n    const targetUrl = typeof exportsApi.getMarianaTargetUrl === "function"\n      ? exportsApi.getMarianaTargetUrl()\n      : "mari://index_nemesis.entry.hadal";\n    const routeError = typeof exportsApi.getMarianaRouteError === "function"\n      ? exportsApi.getMarianaRouteError()\n      : "No active route has been found";\n\n    const LOGIN_USER = "marekrev";\n    const LOGIN_PASS = "!domj634$fod*xc90";\n    const ASSET_ROOT = "mod-asset://nemesis-protocol-stage1/apps/mariana-browser/assets/projects/";\n\n    const repository = [\n      {\n        id: "MAIN",\n        title: "NEMESIS - PROTOCOL",\n        subtitle: "Here lies the cabinet they are trying to hide.",\n        description: `This repo contains evidence of forbidden programs involving atmospheric manipulation studies, domestic surveillance infrastructure, crisis-timed media control, Antarctic anomaly research, temporal experiments, biological discoveries beneath ice, and autonomous systems designed to preserve secrets beyond human oversight.\n\nThe purpose of Nemesis Protocol is not simply to recover stolen files. Its purpose is to prevent what officials call \u201Cnarrative ignition\u201D: the moment when scattered classified accusations become one understandable pattern in the public mind.\n\nIf the archives turn public, trust in governments, scientific institutions, emergency systems, media channels, and consumer technology could collapse. The protocol therefore prioritizes containment, discrediting, evidence recovery, and, if necessary, the creation of larger distractions to bury the accusations beneath fear.`\n      },\n      {\n        id: "CHRONOS_LATTICE",\n        title: "CHRONOS_LATTICE",\n        image: "chronos_lattice.jpg",\n        description: `Chronos Lattice was a restricted temporal integrity program disguised as detector synchronization and magnet-timing research. In practice, it studied moments where records, instruments, and human memory briefly diverged before reality settled into one official sequence. The project never proved operational time travel. It proved something more dangerous: under certain high-energy conditions, information could appear before its cause, leaving behind warnings, logs, and memories from events that had not yet happened.`\n      },\n      {\n        id: "GLASS_CASCADE",\n        title: "GLASS_CASCADE",\n        image: "glass_cascade.jpg",\n        description: `Glass Cascade was a classified narrative-management program disguised as counter-disinformation and emergency communication research. It studied how public attention fractures when multiple crises collide: war, scandal, disease, market panic, religious fear, celebrity crime, and technological anxiety.\n\nThe project\u2019s hidden purpose was not to erase truth, but to bury it in plain sight. By arranging crises in overlapping waves, Glass Cascade made real information visible yet impossible to hold long enough to understand. Its core discovery was simple and poisonous: people do not need to be lied to if they can be forced to look everywhere at once.`\n      },\n      {\n        id: "HOMECOMMAND_ECHO",\n        title: "HOMECOMMAND_ECHO",\n        image: "homecommand_echo.jpg",\n        description: `HomeCommand Echo was a classified domestic sensor-infrastructure program disguised as emergency alert reliability and smart-home safety certification. It studied how everyday devices, such as speakers, cameras, phones, routers, televisions, cars, thermostats, watches, doorbells, and appliances, could quietly cooperate during declared emergencies.\n\nThe project\u2019s hidden purpose was to turn a home into one combined sensor system. No single device had to know everything. Together, through chained trust certificates and emergency update pathways, they could infer movement, presence, location, routine, and behavior. Its core warning was brutal: a house does not need to be bugged if every helpful tool inside it can become a witness.`\n      },\n      {\n        id: "ICEWALL_MERIDIAN",\n        title: "ICEWALL_MERIDIAN",\n        image: "icewall_meridian.jpg",\n        description: `Icewall Meridian was a classified geospatial program disguised as Antarctic climate mapping, ice-sheet stability research, and polar navigation calibration. It investigated satellite, radar, and acoustic anomalies near Antarctic margins where ice, water, stone, and signal reflection did not behave according to known layering.\n\nThe project\u2019s hidden concern was not a literal wall, but a meridian discontinuity: a persistent structural pattern beneath ice and seabed layers. Survey teams reported straight-edge radar returns, impossible acoustic depths, thermal scars, terraces, columns, and grid-like cavities under regions believed to be inert. Its central warning was stark: if ruins are still active, they are not ruins.`\n      },\n      {\n        id: "JANUS_GATE",\n        title: "JANUS_GATE",\n        image: "janus_gate.jpg",\n        description: `Janus Gate was a classified trans-dimensional telemetry program disguised as quantum-secure deep-space communication research. It investigated strange signal behavior where probes and relay systems received structured replies from no known satellite, station, or human source.\n\nThe project did not prove a stable physical portal. Its real discovery was an inference aperture: a temporary communication window where information seemed to cross from a neighboring state of reality. Janus Gate\u2019s warning was simple and chilling: a door is only safe when both sides agree it is closed.`\n      },\n      {\n        id: "BLACK_ICE_BIORESERVOIR",\n        title: "BLACK_ICE_BIORESERVOIR",\n        image: "black_ice_bioreservoir.jpg",\n        description: `Black Ice Bioreservoir was a classified biological anomaly program disguised as subglacial microbial ecology and Antarctic climate-core sampling. It investigated organisms recovered from isolated liquid channels beneath the ice: dormant microbes, virus-like particles, and symbiotic biofilms able to survive darkness, pressure, radiation, and nutrient absence.\n\nThe project\u2019s real concern was not simple infection. It was ecological rewriting: lifeforms that appeared to change dormancy and metabolism in response to biological stress around them. Its warning was quietly terrifying: this does not kill the host. It teaches the host a different definition of survival.`\n      },\n      {\n        id: "AURORA_VEIL",\n        title: "AURORA_VEIL",\n        image: "aurora_veil.jpg",\n        description: `Aurora Veil was a classified atmospheric influence program disguised as climate reflectivity modeling, emergency pollutant tracking, and aviation dispersion analysis. It studied how high-altitude environmental markers could affect public behavior during crises without giving direct commands.\n\nThe project\u2019s real focus was cognitive weather: whether fatigue, anxiety, confusion, trust in authority, and dependence on official guidance could be shaped by the surrounding environment. Its warning was sharp: a program built to study vulnerability during emergencies will attract people who want emergencies to become permanent.`\n      },\n      {\n        id: "BLACK_SWAN",\n        title: "BLACK_SWAN",\n        image: "black_swan.jpg",\n        description: `Black Swan was a classified counter-disclosure operation created after the Nemesis cell vanished with stolen archives. Its purpose was to locate Lucien Marek and his team, recover the classified files, destroy every unauthorized copy, and prevent the public from believing the evidence if it surfaced.\n\nThe operation\u2019s real weapon was not force alone. It was terminal denial: erase the archive, discredit the witnesses, prepare false media explanations, and make the truth look unstable before anyone could understand it. Its warning was cold: a secret is not protected when the file is burned. It is protected when nobody alive can explain why it mattered.`\n      },\n      {\n        id: "OPERATION_NEMESIS",\n        title: "OPERATION_NEMESIS",\n        image: "operation_nemesis.jpg",\n        description: `Operation Nemesis is the name given to the missing cell led by Lucien Marek: nine scientists who allegedly stole a sealed archive from a government-controlled research vault.\n\nThe operation revolves around the archive itself: documents linking atmospheric influence, domestic sensor systems, Antarctic anomalies, temporal research, AI secrecy, and media manipulation programs. Nemesis is dangerous not because of weapons, but because Marek\u2019s team understands how the secrets connect. Its warning is brutal: if the archive is real, it could break public trust; if it is false, it is designed well enough to become true in public imagination.`\n      }\n    ];\n\n    const address = document.getElementById("address");\n    const go = document.getElementById("go");\n    const reload = document.getElementById("reload");\n    const statusText = document.getElementById("statusText");\n    const hint = document.getElementById("hint");\n    const errorLayer = document.getElementById("errorLayer");\n    const errorMessage = document.getElementById("errorMessage");\n    const site = document.getElementById("site");\n    const loginView = document.getElementById("loginView");\n    const repoView = document.getElementById("repoView");\n    const loginForm = document.getElementById("loginForm");\n    const username = document.getElementById("username");\n    const password = document.getElementById("password");\n    const loginError = document.getElementById("loginError");\n    const directoryList = document.getElementById("directoryList");\n    const previewTitle = document.getElementById("previewTitle");\n    const projectImage = document.getElementById("projectImage");\n    const mainSubtitle = document.getElementById("mainSubtitle");\n    const previewDescription = document.getElementById("previewDescription");\n    const imageModal = document.getElementById("imageModal");\n    const modalTitle = document.getElementById("modalTitle");\n    const modalImage = document.getElementById("modalImage");\n    const zoomIn = document.getElementById("zoomIn");\n    const zoomOut = document.getElementById("zoomOut");\n    const closeModal = document.getElementById("closeModal");\n    const loginSubmit = document.getElementById("loginSubmit");\n\n    let currentUrl = "";\n    let loggedIn = false;\n    let currentDirectory = "MAIN";\n    let zoomLevel = 1;\n\n    function isRouteActive() {\n      try {\n        return Boolean(typeof exportsApi.isMarianaRouteActive === "function" && exportsApi.isMarianaRouteActive());\n      } catch (_error) {\n        return false;\n      }\n    }\n\n    function updateStatus() {\n      const active = isRouteActive();\n      statusText.textContent = active ? "route: active" : "route: offline";\n      statusText.className = active ? "status-online" : "status-offline";\n      return active;\n    }\n\n    function hideAll() {\n      hint.style.display = "none";\n      site.style.display = "none";\n      errorLayer.style.display = "none";\n      imageModal.style.display = "none";\n    }\n\n    function showError() {\n      hideAll();\n      errorMessage.textContent = routeError;\n      errorLayer.style.display = "flex";\n    }\n\n    function showIdle() {\n      hideAll();\n      hint.style.display = "flex";\n    }\n\n    function showLogin() {\n      hideAll();\n      site.style.display = "block";\n      loginView.style.display = "flex";\n      repoView.style.display = "none";\n      loginError.textContent = "";\n      username.focus();\n    }\n\n    function showRepository() {\n      hideAll();\n      site.style.display = "block";\n      loginView.style.display = "none";\n      repoView.style.display = "grid";\n      renderDirectory(currentDirectory);\n    }\n\n    function navigate() {\n      const active = updateStatus();\n      const requested = address.value.trim();\n      currentUrl = requested;\n\n      if (!active || requested !== targetUrl) {\n        showError();\n        return;\n      }\n\n      if (loggedIn) {\n        showRepository();\n      } else {\n        showLogin();\n      }\n    }\n\n    function renderDirectoryButtons() {\n      directoryList.innerHTML = "";\n      for (const entry of repository) {\n        const button = document.createElement("button");\n        button.type = "button";\n        button.className = "dir-button";\n        button.textContent = entry.id;\n        button.dataset.dir = entry.id;\n        button.addEventListener("click", () => renderDirectory(entry.id));\n        directoryList.appendChild(button);\n      }\n    }\n\n    function renderDirectory(id) {\n      const entry = repository.find((item) => item.id === id) || repository[0];\n      currentDirectory = entry.id;\n      previewTitle.textContent = entry.title;\n      previewTitle.classList.toggle("main-title", entry.id === "MAIN");\n      mainSubtitle.textContent = entry.subtitle || "";\n      mainSubtitle.style.display = entry.subtitle ? "block" : "none";\n      previewDescription.textContent = entry.description;\n      previewDescription.classList.toggle("main-description", entry.id === "MAIN");\n\n      if (entry.image) {\n        projectImage.src = ASSET_ROOT + entry.image;\n        projectImage.alt = entry.title;\n        projectImage.style.display = "block";\n      } else {\n        projectImage.removeAttribute("src");\n        projectImage.alt = "";\n        projectImage.style.display = "none";\n      }\n\n      for (const button of directoryList.querySelectorAll(".dir-button")) {\n        button.classList.toggle("active", button.dataset.dir === entry.id);\n      }\n    }\n\n    function openImageModal() {\n      const entry = repository.find((item) => item.id === currentDirectory);\n      if (!entry || !entry.image) return;\n      zoomLevel = 1;\n      modalTitle.textContent = entry.title;\n      modalImage.src = ASSET_ROOT + entry.image;\n      modalImage.alt = entry.title;\n      modalImage.style.transform = "scale(1)";\n      imageModal.style.display = "flex";\n      imageModal.setAttribute("aria-hidden", "false");\n    }\n\n    function closeImageModal() {\n      imageModal.style.display = "none";\n      imageModal.setAttribute("aria-hidden", "true");\n    }\n\n    function updateZoom(delta) {\n      zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + delta));\n      modalImage.style.transform = `scale(${zoomLevel})`;\n    }\n\n    go.addEventListener("click", navigate);\n    reload.addEventListener("click", () => {\n      if (!currentUrl) {\n        if (!updateStatus()) showError();\n        return;\n      }\n      navigate();\n    });\n    address.addEventListener("keydown", (event) => {\n      if (event.key === "Enter") navigate();\n    });\n\n    function handleLoginAttempt() {\n      const typedUser = String(username.value || "").trim();\n      const typedPass = String(password.value || "").trim();\n\n      if (typedUser === LOGIN_USER && typedPass === LOGIN_PASS) {\n        loggedIn = true;\n        currentDirectory = "MAIN";\n        loginError.textContent = "";\n        showRepository();\n        return;\n      }\n\n      loginError.textContent = "Wrong credentials, try again";\n      loginError.style.display = "block";\n      password.value = "";\n      password.focus();\n    }\n\n    window.arkAuthenticate = handleLoginAttempt;\n\n    loginForm.addEventListener("submit", (event) => {\n      event.preventDefault();\n      handleLoginAttempt();\n      return false;\n    });\n\n    loginSubmit.addEventListener("click", handleLoginAttempt);\n\n    username.addEventListener("keydown", (event) => {\n      if (event.key === "Enter") {\n        event.preventDefault();\n        handleLoginAttempt();\n      }\n    });\n\n    password.addEventListener("keydown", (event) => {\n      if (event.key === "Enter") {\n        event.preventDefault();\n        handleLoginAttempt();\n      }\n    });\n\n    projectImage.addEventListener("click", openImageModal);\n    closeModal.addEventListener("click", closeImageModal);\n    zoomIn.addEventListener("click", () => updateZoom(0.25));\n    zoomOut.addEventListener("click", () => updateZoom(-0.25));\n\n    renderDirectoryButtons();\n    address.value = "";\n    if (!updateStatus()) {\n      showError();\n    } else {\n      showIdle();\n    }\n\n    window.setInterval(() => {\n      const active = updateStatus();\n      if (!active) {\n        loggedIn = false;\n        showError();\n      }\n    }, 1000);\n  </script>\n</body>\n</html>\n';

// src/apps/MarianaBrowserApp.ts
var ROUTE_ERROR = "No active route has been found";
var MarianaBrowserApp = class extends import_hackhub_content_sdk21.App {
  constructor() {
    super(...arguments);
    this.AppName = "ark";
    this.Title = "Ark";
    this.Icon = "mod-asset://nemesis-protocol-stage1/apps/mariana-browser/assets/mariana-browser-icon.png";
    this.HTML = mariana_browser_default;
    this.DefaultSize = { width: 920, height: 620 };
    this.MinSize = { width: 720, height: 460 };
    this.MaxOpen = 1;
    this.Unlocked = true;
    this.Store = {
      title: "Ark",
      description: "A Mariana-only routing interface. Requires an active mari_init route.",
      ratings: 4.7
    };
    this.Exports = {
      getMarianaTargetUrl: () => MARIANA_URL,
      getMarianaRouteError: () => ROUTE_ERROR,
      isMarianaRouteActive: () => isMarianaResolverActive()
    };
  }
};
MarianaBrowserApp = __decorateClass([
  import_hackhub_content_sdk21.RegisterApp
], MarianaBrowserApp);

// src/index.ts
var NemesisProtocolStage1 = class extends import_hackhub_content_sdk22.Bootstrap {
  OnModPackageLoaded() {
    resetMarianaResolver();
    registerNemesisMailTemplates();
    this.unsubscribeMarianaProcessKilled = import_hackhub_content_sdk22.Events.on("Process.Killed", (process) => {
      if (process.name === "mari_init") {
        setMarianaResolverActive(false);
      }
    });
    console.log(
      "[nemesis-protocol-stage1] Nemesis Protocol loaded. The mission is waiting in the HackHub feed."
    );
  }
  OnModPackageUnloaded() {
    this.unsubscribeMarianaProcessKilled?.();
    unregisterNemesisMailTemplates();
    setMarianaResolverActive(false);
  }
};
NemesisProtocolStage1 = __decorateClass([
  import_hackhub_content_sdk22.RegisterModPackage
], NemesisProtocolStage1);
