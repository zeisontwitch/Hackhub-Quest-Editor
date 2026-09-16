# GENERAL QA NOTES

Steam:
App ID: 2980270
Build ID: 25341308

- Every test is done on a clean save and reset to the clean save after the test is done. Please tell me if you want me to keep a save instead.
- In-Game time runs at 1 real second = 1 in-game minute

---

# Terminal A

Zeis~$ [/home/Zeis] qe24 status
QE24 SDK 0.24 QA harness
Host: http://qe24-http.test/
Wi-Fi: QE24-RAW-5G / correct-horse-battery
Time.now: 1789717370205 scale=60
Scheduler pending: 0
HTTP history: 0; intercept enabled: false; intercept queue: 0
Visible Wi-Fi networks: 8
Target Wi-Fi details: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Connected Wi-Fi: Graham.Boyle61 ip=84.116.23.14 bssid=f9:0b:5f:8c:fb:eb channel=1 wps=false signal=1 rssi=-71
Tip: run qe24 next if the 6/6 surface objective quest is already done, qe24 intercept for proxy-test steps, or qe24 history for HTTP/collab evidence.
Commands: qe24 guide · qe24 next · qe24 status · qe24 history · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 reset

Zeis~$ [/home/Zeis] e24 history
HTTP history entries: 0
Collaborator hits: 3
- http zs5gcawf.qe24-collab.test/qe24 method=GET t=1789715957805
- http zs5gcawf.qe24-collab.test/qe24 method=GET t=1789714401945
- http zs5gcawf.qe24-collab.test/qe24 method=GET t=1789711925805
Held intercept requests: 0


--> Connected to QE24 Wifi

Zeis~$ [/home/Zeis] qe24 status
QE24 SDK 0.24 QA harness
Host: http://qe24-http.test/
Wi-Fi: QE24-RAW-5G / correct-horse-battery
Time.now: 1789722784665 scale=60
Scheduler pending: 0
HTTP history: 0; intercept enabled: false; intercept queue: 0
Visible Wi-Fi networks: 8
Target Wi-Fi details: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Connected Wi-Fi: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Tip: run qe24 next if the 6/6 surface objective quest is already done, qe24 intercept for proxy-test steps, or qe24 history for HTTP/collab evidence.
Commands: qe24 guide · qe24 next · qe24 status · qe24 history · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 reset

--> Connected to another WiFi instead (Mozelle_Fisher)

Zeis~$ [/home/Zeis] qe24 status
QE24 SDK 0.24 QA harness
Host: http://qe24-http.test/
Wi-Fi: QE24-RAW-5G / correct-horse-battery
Time.now: 1789726713645 scale=60
Scheduler pending: 0
HTTP history: 0; intercept enabled: false; intercept queue: 0
Visible Wi-Fi networks: 8
Target Wi-Fi details: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Connected Wi-Fi: Mozelle_Fisher ip=182.98.171.244 bssid=dc:18:06:b6:9a:01 channel=9 wps=false signal=0 rssi=-87
Tip: run qe24 next if the 6/6 surface objective quest is already done, qe24 intercept for proxy-test steps, or qe24 history for HTTP/collab evidence.
Commands: qe24 guide · qe24 next · qe24 status · qe24 history · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 reset

--> Disconnected from all WiFi networks (no in-game internet connection at all)

Zeis~$ [/home/Zeis] qe24 status
QE24 SDK 0.24 QA harness
Host: http://qe24-http.test/
Wi-Fi: QE24-RAW-5G / correct-horse-battery
Time.now: 1789728351525 scale=60
Scheduler pending: 0
HTTP history: 0; intercept enabled: false; intercept queue: 0
Visible Wi-Fi networks: 8
Target Wi-Fi details: QE24-RAW-5G ip=189.65.179.242 bssid=02:24:00:00:24:01 channel=44 wps=true signal=3 rssi=-53
Connected Wi-Fi: unavailable
Tip: run qe24 next if the 6/6 surface objective quest is already done, qe24 intercept for proxy-test steps, or qe24 history for HTTP/collab evidence.
Commands: qe24 guide · qe24 next · qe24 status · qe24 history · qe24 http-fetch · qe24 schedule 1 · qe24 collab · qe24 intercept on|off|queue|forward|drop · qe24 claim complete|button|retire|unclaim · qe24 complete · qe24 button-ready · qe24 retire · qe24 unclaim · qe24 reset

--> Reconnected to QE24 WiFi

Zeis~$ [/home/Zeis] qe24 claim complete
Claimed QE24DirectCompleteProbe.

--> Received new Objective and received the "QE24 scheduled job fired" email. Content:
"Scheduler job qe24-scheduled-mail fired at in-game time 1789713471705.

Payload: {"command":"qe24 schedule","minutes":1}" 

Zeis~$ [/home/Zeis] qe24 complete
Emitted QE24.CompleteNow. Watch for the completion mail and renderer freeze.

--> Latest objective completed, toast popped, email received. No freezes.

Zeis~$ [/home/Zeis] qe24 claim button
Claimed QE24CompleteButtonProbe.

--> New Objective "QE24 Complete button probe"

Zeis~$ [/home/Zeis] qe24 button-ready
Button-probe objective completed. Click the quest Complete button now.

--> More popups. Clicking the "Complete" button doesn't freeze, it completes the objective, the objective disappears.

Zeis~$ [/home/Zeis] qe24 claim retire
Claimed QE24RetireProbe.

--> New objective

Zeis~$ [/home/Zeis] qe24 retire
Emitted QE24.RetireNow. The retire quest should disappear.

--> Objective disappears, toast popped.

Zeis~$ [/home/Zeis] qe24 claim unclaim
Claimed QE24UnclaimTarget.

--> New objective

Zeis~$ [/home/Zeis] qe24 unclaim
Called Quest.unclaim("QE24UnclaimTarget").

--> Objective disappears

Zeis~$ [/home/Zeis] qe24 schedule 10

--> Executed command, save/logged out, reloaded save -> objective complete.

---

# Quick Tests:

- Abandon from UI works.

- qe24 reset works and after a reload, qe24 seed puts out "✓ QE24 per-save content seeded."

- Breaking into our QE24 WiFi network (which is the main way a player gets access to those networks, so definitely worth a test) via bettercap does throw one error: When I use set wifi.ap 02:24:00:00:24:01 I get [21:23:49] [sys.log] Target AP set to 02:24:00:00:24:01 (SSID: undefined) in return. The SSID should not read undefined, but QE24-RAW-5G. Deauthing it however, does produce a [21:26:00] [sys.log] Handshake captured: /home/Zeis/qe24-raw-5g.pcap which is odd. The rest of the hack works without issues, I get the password after using hashcat on the pcap file.

- I would test "DNS-only collaborator lookup if nslookup/dig exist" but I don't actually know what you want me to do here. I ran nslookup qe24-website.test just because, and it returned "No results found." which makes sense if we didn't add any results for the nslookup tool to find.
