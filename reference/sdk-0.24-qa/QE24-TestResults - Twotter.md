# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25388883

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.

---

# Terminal A

Zeis~$ [/home/Zeis] qe24 twotter seed

createUser + addUser done. Search Twotter for: qe24_probe
The profile must open, show the bio above, and search must not crash.
Stored record now:
qe24-probe-user: id: "qe24-probe-user" username: "qe24_probe" name: "Somnuek" surname: "Atieno" avatar: "c40997215ca203c03186344f4b2386ba3696b67d_full.jpg" banner: "https://picsum.photos/seed/4d6SyyaNP/1024/360?blur=9" bio: "SDK 0.24 probe account, made by qe24 twotter seed." joinedAt: "Sat Aug 01 2026" followers: 99 following: 29 verified: true password: "R6n0JdGVeUKfsQS" isMine: undefined

--> Opened twotter.com in the in-game browser and searched for "qe24_probe". Search result:
"Somnuek Atieno
@qe24_probe
SDK 0.24 probe account, made by qe24 twotter seed."

--> The first Objective in the Twotter probe quest did not complete, remains open by this point.

--> Opened profile of @qe24_probe, again, the objective doesn't tick but the profile opens without an issue and no crash or freeze.

Zeis~$ [/home/Zeis] qe24 twotter post
postTweet done. Open the profile of qe24_probe and confirm the tweet is there.
The post-seen objective should tick if you open it from the timeline.

--> The new tweet immediately appears in the profile and the Objective for this command gets checked.

Zeis~$ [/home/Zeis] qe24 twotter bad
Planted the r31 record shape: bio present but undefined. Now search Twotter for: qe24_badrecord
Search surviving = the crash is fixed at the read path. It crashing = the bug is open.
If it crashes, close the game WITHOUT saving; the crash itself is the T-02 answer.
Stored record now:
qe24-bad-record: id: "qe24-bad-record" username: "qe24_badrecord" name: "QE24" surname: "BadRecord" avatar: "" banner: "" bio: undefined joinedAt: "2026-09-18T13:19:38.256Z" followers: 0 following: 0 verified: undefined password: "" isMine: undefined

--> Searched for "qe24_badrecord", search survived, profile is listed in search results. Objective did not tick.

--> Saved game, quit to menu, reloaded save. No issues.

Zeis~$ [/home/Zeis] qe24 twotter status
QE24 Twotter probe status
Twotter API: available
Functions present: createUser, addUser, updateUser, removeUser, postTweet, removeTweet, getUserById, getUserByUsername, toggleLike
Records in this save:
qe24-probe-user: id: "qe24-probe-user" username: "qe24_probe" name: "Somnuek" surname: "Atieno" avatar: "c40997215ca203c03186344f4b2386ba3696b67d_full.jpg" banner: "https://picsum.photos/seed/4d6SyyaNP/1024/360?blur=9" bio: "SDK 0.24 probe account, made by qe24 twotter seed." joinedAt: "Sat Aug 01 2026" followers: 99 following: 29 verified: true password: "R6n0JdGVeUKfsQS" isMine: undefined
qe24-bad-record: id: "qe24-bad-record" username: "qe24_badrecord" name: "QE24" surname: "BadRecord" avatar: "" banner: "" bio: undefined joinedAt: "2026-09-18T13:19:38.256Z" followers: 0 following: 0 verified: undefined password: "" isMine: undefined
qe24-declared-user: id: "qe24-declared-user" username: "qe24_declared" name: "QE24" surname: "Declared Account" avatar: "" banner: "" bio: "Declared by the quest definition, not by the API." joinedAt: "2025-09-18T13:14:02.327Z" followers: 0 following: 0 verified: true password: "" isMine: undefined
Tweets: SDK 0.24 has no tweet reader, so check the profile screen for:
qe24_probe (API post) and qe24_declared (quest-declared tweet)

--> Objective did not tick, no other issues.

Zeis~$ [/home/Zeis] qe24 twotter cleanup
removeTweet -> called
removeUser(qe24_probe) -> true
removeUser(qe24_badrecord) -> true
removeUser(qe24_declared) -> true
true = gone. Search for each handle: none should appear, and search must still work.
false on qe24_declared means the quest-declared path needs a second look before we ship accounts.

--> No issues, Objective did not tick. Searching for "qe24_declared" does not yield results, as expected.