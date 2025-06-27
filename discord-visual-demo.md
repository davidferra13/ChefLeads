# Visual Demo: Discord SMS Lead Bot Replies

Here's what the bot replies should look like in your Discord channel:

## Example 1: High Confidence Lead

```
[Tasker SMS Relay] From: +15551234567 - Hello, I'm looking for a private chef for my anniversary dinner next weekend for 8 people. What are your rates and menu options?
```

**Bot Reply:**
```
I detected a potential lead from this SMS message!

[EMBED]
Title: NEW LEAD DETECTED: HIGH CONFIDENCE (85%)
Color: Green

Description: A new potential lead has been detected from SMS

Fields:
* Type: lead
* Score: 0.85 (High)
* Matched Keywords: chef, private, dinner, anniversary, weekend, rates, menu options
* Categories: service, booking, date, event, inquiry
* Next Steps: This lead has been added to your dashboard for follow up.

Footer: Lead ID: msg-12345
```

## Example 2: Medium Confidence Lead

```
[Tasker SMS Relay] From: +15559876543 - Can you cook at our Airbnb next Saturday?
```

**Bot Reply:**
```
I detected a potential lead from this SMS message!

[EMBED]
Title: NEW LEAD DETECTED: MEDIUM CONFIDENCE (45%)
Color: Orange

Description: A new potential lead has been detected from SMS

Fields:
* Type: lead
* Score: 0.45 (Medium)
* Matched Keywords: cook, saturday
* Categories: service, date
* Next Steps: This lead has been added to your dashboard for follow up.

Footer: Lead ID: msg-67890
```

## Example 3: Low Confidence Message (No Reply)

```
[Tasker SMS Relay] From: +15556667777 - Hey, what time are we meeting later?
```

*No bot reply is generated for low-confidence messages*

## Behind The Scenes

1. **Message Received:** SMS forwarded from Tasker to Discord channel
2. **Analysis:** System analyzes for chef-related keywords and intent
3. **Lead Detection:** If confidence threshold is met, identified as lead
4. **Bot Reply:** Discord bot automatically replies with formatted summary
5. **Dashboard:** Lead data saved with Discord message references
6. **Tracking:** Both original message ID and reply message ID are stored

These replies are generated real-time as SMS messages arrive in your Discord channel!
