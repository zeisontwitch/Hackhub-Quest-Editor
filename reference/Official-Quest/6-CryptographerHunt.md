# Cryptographer Hunt

1. Accept this quest on hackhub.com

"Investigate the Twotter user's profile who claims to have made a fortune in cryptocurrencies. Gather detailed information about him by establishing contact using social engineering techniques to obtain his phone number. Then, send him a phishing message aimed at acquiring his bank details to take over the funds from his account."

2. Receive this Email

"Subject: Cryptographer Hunt

This guy keeps making money from cryptocurrencies. He looks suspicious. I’m sure he didn’t earn that money honestly. Anyway, hack into his bank account and transfer all the funds to the account I specify.

Target: Richard Thomesen
IBAN: SN51F98I7922Q515U7EK8WG1142K27"

3. The hack

- Research the target

`lynx Richard Thomesen`

Result:
Scanning social media platforms...
Accounts: Twotter account was found with the registered username @richard.thomesen
Searching for contact information...
Email(s): richard.thomesen340@outlook.biz
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
No data found.

- Research something target is consistently interested in.

Check his twotter account -> He has 5 tweets with "#Bitvista" in them -> `lynx Bitvista`

Result:
Scanning social media platforms...
No data found.
Searching for contact information...
No data found.
Checking for IP address activity...
No data found.
Locating physical address...
No data found.
Searching web for additional information...
Info(s): A phone number registered to this name was found: 907-690-2960

- Call the phone number

Open phone -> Click on the phone app -> dial 907-690-2960 (dashes included) and call:

Call Center: "Bitvista customer service, how can I help you?"
Click on "I can not log into my account." -> Character says: "I cant log in to my account, I changed my phone number, could it be because of that?"
Call Center: "It's probably for that reason. Can I know your name?"
Click on: "Richard Thomesen" -> Character says "Richard Thomesen."
Call Center: "Thank you Mr. Richard, I'm checking right now. Please wait..."
(The game waits 4 seconds before the next line)
Call Center: "When I review your account, I see that this is your registered phone number. 907-313-9344"
Click on: "I logged in." -> Character says: "Thank you, I am logged in now."
Call Center: "You're welcome, have a nice day."
Phone call ends here.

- Call the target and deceive him (907-313-9344)

Open phone -> Click on the phone app -> dial 907-313-9344 (dashes included) and call:

Character says: "Hello Mr. Richard, I'm calling you from Liberty Central Bank. My name is Alex Johnson."
Richard Thomesen: "Hello Alex, how can I help you?"
Two Choices. Choice 1: "We urgently need to secure the account." (fail), Choice 2: "Suspicious crypto transactions detected." (correct)
Click on "Suspicious crypto transaction detected" -> Character says "Mr. Richard, we've detected some suspicious crypto transactions in your account. Could you please confirm your recent transactions?"
Richard Thomesen: "Sure, I recently transferred some Bitcoin to another wallet. Is that causing the issue?"
Click on: "That might be it." -> Character says "That might be it. We need to ensure that your account hasn't been compromised. Can you verify your last transaction amount?"
Richard Thomesen: "I think it was around $10,000 worth of Bitcoin."
Click on: "Secure your account." -> Character says "Thank you for confirming. To be safe, we need to secure your account. I will send you an email with a link. Please click on it and follow the instructions to secure your account. Please check it immediately."
Richard Thomesen: "Okay, I'll check my email now."
Click on: "Have a nice day." -> Character says "Have a nice day."
Phone Call ends here.

- Send a phishing email to richard.thomesen340@outlook.biz and capture their information

Go to my E-Mail and compose a new mail ->
To: "richard.thomesen340@outlook.biz" -> 
Click on Dropdown in Subject Field and select "LCB Credential Harvester" ->
Click on the red underline for "Full Name" and fill in the correct name (has to be exact, wrong name fails increases suspicion level) -> 
Click on Attachments and select "Liberty Central Bank Form.html" ->
Send Email ->
Wait for Reply ->
Receive This email from richard.thomesen340@outlook.biz:
Subject: Bank account credentials
Bank account information was compromised.

ID: 13086787867
Password: 464646

- Send all the money in the bank to the iban you received in the contractor email

Go to lcb.com ->
Log into account with the phished account details ->
Click on "Transfer" under Quick actions ->
Enter IBAN and click on "Max" for the available amount, and enter some sort of description (doesn't matter) -> Transfer ->
Log out of account
Click on "Complete" on hackhub.com quest

4. If the player checks Richard's twotter account, they'll see a new tweet: "Some assholes stole all my crypto money!!!!"