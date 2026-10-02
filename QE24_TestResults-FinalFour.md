Fresh save, no mods other than our `editor-export` and `mods`



## D-01 - Green

Connected to Wi-Fi Network `QE24-LAB-5G`

Ran command `ssh -h qa@10.24.0.2` and used password `wifi-child`

Terminal output:

```
qa@10.24.0.2~$ ls
etc
home
logs
lib
etc
home
logs
lib
delete-me.txt

qa@10.24.0.2~$ rm delete-me.txt
Moved to trash.

qa@10.24.0.2~$ cd logs

qa@10.24.0.2~$ rm qa.txt
qa@10.24.0.2~$ 
```

A "System Notification" pop-up appears that reads: "Error - This file cannot be deleted"

I ran `ls` again to confirm and the qa.txt file is indeed still there.



## S-11 - Green

I ran `qe24 schedule 120` and the in-game clock does indeed show "NEXT EVENT: 2h" and ticks down by one minute for every real second.



## 3 - Curl - Red

```
Zeis~$[/home/Zeis] curl http://qe24-http.test/
Command "curl http://qe24-http.test/" not found.
```

## T-08

Terminal Output:

```
Zeis~$[/home/Zeis] qe24 twotter seed
createUser + addUser done. Search Twotter for: qe24_probe
The profile must open, show the bio above, and search must not crash.
Stored record now:
qe24-probe-user: id: "qe24-probe-user" username: "qe24_probe" name: "Elizabeth" surname: "Jones" avatar: "651bb4a9e2c63f585f236a0d002f0df390aa7898_full.jpg" banner: "https://picsum.photos/seed/z7lN0a/1024/360?blur=10" bio: "SDK 0.24 probe account, made by qe24 twotter seed." joinedAt: "Tue Jul 28 2026" followers: 64 following: 8 verified: true password: "7kRDnhejcPpcWxg" isMine: undefined
Zeis~$[/home/Zeis] qe24 twotter audit
Editor export: loaded (v1.0.52 (2026-09-28.r241)).
QE24 Twotter audit - the handles this QA round creates:
@qe24_probe (id qe24-probe-user): bio is a string (50 chars); verified yes; followers 64; following 8; joined Tue Jul 28 2026
@qe24_badrecord: not on this save
@qe24_declared: not on this save
@qe24_editor: not on this save
1 of 4 handles present; 0 carrying the r31 poison shape.
A hand-crafted account with an empty avatar/banner is normal for this harness;
what matters is the bio line: 0 poisoned means search cannot hit the r31 crash here.
T-11/T-12/T-15 expect the editor's @qe24_editor to LEAVE this list once its quests finish.
```

I open twotter and search for the profile. "Elizabeth Jones" is the name, it has a verified checkmark, a game-generated banner image and profile picture. The username is @qe24_probe, the account bio reads "SDK 0.24 probe account, made by qe24 twotter seed." The account has 8 Following, 64 Followers, no posts.
