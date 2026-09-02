import type { JokeTone, YoMamaJoke } from "./types";

type JokeSeed = readonly [id: string, category: string, text: string, tags?: readonly string[]];

function makeJokes(tone: JokeTone, seeds: readonly JokeSeed[]): YoMamaJoke[] {
  return seeds.map(([id, category, text, tags], index) => ({
    id,
    category,
    text,
    tags: [...(tags ?? [category, tone])],
    tone,
    featured: index < 3,
  }));
}

export const bestJokes = makeJokes("clever", [
  // All-time classics
  ["best-classic-01", "slow", "Yo mama so slow, she missed the bus while she was already on it."],
  ["best-classic-02", "old", "Yo mama so old, her first selfie was a cave painting."],
  ["best-classic-03", "forgetful", "Yo mama so forgetful, she put a reminder on her reminder."],
  ["best-classic-04", "cooking", "Yo mama so bad at cooking, the smoke alarm calls ahead for backup."],
  ["best-classic-05", "broke", "Yo mama so broke, the bank sends her sympathy cards."],
  ["best-classic-06", "messy", "Yo mama so messy, her junk drawer has a lost-and-found."],
  ["best-classic-07", "dramatic", "Yo mama so dramatic, she needs an intermission to tell a short story."],
  ["best-classic-08", "lateness", "Yo mama so late, she arrived at sunrise with a dinner reservation."],
  ["best-classic-09", "clumsy", "Yo mama so clumsy, she tripped over a wireless connection."],
  ["best-classic-10", "lazy", "Yo mama so lazy, her hammock filed for overtime."],

  // Best modern jokes
  ["best-modern-01", "technology", "Yo mama so bad with passwords, even her password manager asked for a transfer."],
  ["best-modern-02", "streaming", "Yo mama watches so much streaming, the skip-intro button knows her birthday."],
  ["best-modern-03", "social-media", "Yo mama posts so many stories, the app hired an editor."],
  ["best-modern-04", "work", "Yo mama joins meetings so late, the minutes list her under closing remarks."],
  ["best-modern-05", "gaming", "Yo mama camps so hard in games, the map charges her rent."],
  ["best-modern-06", "dating", "Yo mama’s dating profile has so many filters, it needs a search bar."],
  ["best-modern-07", "wi-fi", "Yo mama’s Wi-Fi so slow, the loading icon stopped to ask for directions."],
  ["best-modern-08", "shopping", "Yo mama shops online so much, the delivery van has a reserved spot."],
  ["best-modern-09", "group-chat", "Yo mama sends so many voice notes, the group chat added chapters."],
  ["best-modern-10", "apps", "Yo mama has so many apps open, her phone started taking attendance."],

  // Best one-liners
  ["best-short-01", "lateness", "Yo mama so late, tomorrow got there first."],
  ["best-short-02", "messy", "Yo mama so messy, dust asks her to tidy up."],
  ["best-short-03", "loud", "Yo mama so loud, her whisper comes with subtitles."],
  ["best-short-04", "forgetful", "Yo mama so forgetful, déjà vu keeps introducing itself."],
  ["best-short-05", "broke", "Yo mama so broke, free trials reject her."],
  ["best-short-06", "dramatic", "Yo mama so dramatic, commas become cliffhangers."],
  ["best-short-07", "slow", "Yo mama so slow, buffering feels impatient."],
  ["best-short-08", "cooking", "Yo mama’s toast needs a fire extinguisher."],
  ["best-short-09", "work", "Yo mama’s out-of-office has an out-of-office."],
  ["best-short-10", "gaming", "Yo mama rage-quit the tutorial."],

  // Battle-ready
  ["best-battle-01", "confidence", "Yo mama talks so much game, the scoreboard asked for evidence."],
  ["best-battle-02", "comebacks", "Yo mama’s comebacks arrive so late, they start with ‘previously on.’"],
  ["best-battle-03", "competition", "Yo mama brought so little heat, the roast battle wore a cardigan."],
  ["best-battle-04", "rhythm", "Yo mama’s timing is so off, even the awkward silence interrupted her."],
  ["best-battle-05", "confidence", "Yo mama entered with main-character energy and background-extra material."],
  ["best-battle-06", "punchlines", "Yo mama’s punchline was so weak, the setup filed a complaint."],
  ["best-battle-07", "competition", "Yo mama came ready to cook and brought a microwave dinner."],
  ["best-battle-08", "comebacks", "Yo mama’s best comeback is still circling the loading screen."],
  ["best-battle-09", "confidence", "Yo mama dropped the mic, then asked it to explain the joke."],
  ["best-battle-10", "punchlines", "Yo mama’s joke took so long, the audience developed a sequel."],

  // Roast Clash picks
  ["best-arena-01", "work", "Yo mama delegates so much, her to-do list has a management team."],
  ["best-arena-02", "money", "Yo mama budgets so badly, her calculator requested hazard pay."],
  ["best-arena-03", "cooking", "Yo mama’s recipes are so confusing, the ingredients formed a support group."],
  ["best-arena-04", "technology", "Yo mama clicks ‘remind me later’ so often, later blocked her number."],
  ["best-arena-05", "messy", "Yo mama’s desktop is so messy, the recycle bin moved out."],
  ["best-arena-06", "driving", "Yo mama uses GPS so badly, the satellite sighs before every turn."],
  ["best-arena-07", "fitness", "Yo mama’s step counter celebrates when she looks for the remote."],
  ["best-arena-08", "work", "Yo mama replies-all so often, the whole company knows her lunch order."],
  ["best-arena-09", "social-media", "Yo mama edits photos so much, her camera roll needs name tags."],
  ["best-arena-10", "gaming", "Yo mama’s aim is so bad, the targets feel left out."],

  // Clever finishes
  ["best-clever-01", "lateness", "Yo mama so late, the welcome sign had already switched to goodbye."],
  ["best-clever-02", "forgetful", "Yo mama so forgetful, she hides her own surprise parties from herself."],
  ["best-clever-03", "dramatic", "Yo mama so dramatic, her weather app reports emotional storms."],
  ["best-clever-04", "broke", "Yo mama so broke, her wallet echoes in lowercase."],
  ["best-clever-05", "messy", "Yo mama’s room is so messy, the floor is considered a rumour."],
  ["best-clever-06", "cooking", "Yo mama seasons food so strangely, the pepper asks follow-up questions."],
  ["best-clever-07", "work", "Yo mama’s calendar is so packed, Tuesday has a waiting list."],
  ["best-clever-08", "technology", "Yo mama’s screen time report arrives as a trilogy."],
  ["best-clever-09", "gaming", "Yo mama loses so often, the respawn button knows her nickname."],
  ["best-clever-10", "social-media", "Yo mama follows so many trends, they’ve started following her back."],
]);

export const funnyJokes = makeJokes("funny", [
  // Ridiculous
  ["funny-ridiculous-01", "pets", "Yo mama talks to the dog so much, he put her on mute."],
  ["funny-ridiculous-02", "shopping", "Yo mama went window-shopping and asked for a receipt."],
  ["funny-ridiculous-03", "cooking", "Yo mama baked a surprise cake; the surprise was that it survived."],
  ["funny-ridiculous-04", "weather", "Yo mama carries an umbrella indoors because her ideas have showers."],
  ["funny-ridiculous-05", "sleep", "Yo mama snores so musically, the neighbours request encores."],

  // Clever and playful
  ["funny-clever-01", "books", "Yo mama reads maps upside down so every trip feels international."],
  ["funny-clever-02", "plants", "Yo mama’s plants are so confused, the cactus asked for swimming lessons."],
  ["funny-clever-03", "work", "Yo mama colour-codes her calendar, then schedules time to admire it."],
  ["funny-clever-04", "money", "Yo mama saves coupons so carefully, they’re worth more as antiques."],
  ["funny-clever-05", "music", "Yo mama sings in the shower and the shampoo requests instrumentals."],

  // Short funny jokes
  ["funny-short-01", "sleep", "Yo mama naps between snoozes."],
  ["funny-short-02", "navigation", "Yo mama gets lost in panoramic photos."],
  ["funny-short-03", "cooking", "Yo mama microwaves salad for warmth."],
  ["funny-short-04", "fashion", "Yo mama irons her tracksuit."],
  ["funny-short-05", "pets", "Yo mama’s goldfish plays fetch better."],

  // Modern laughs
  ["funny-modern-01", "streaming", "Yo mama pauses movies to let the actors catch up."],
  ["funny-modern-02", "technology", "Yo mama uses airplane mode and waits for takeoff."],
  ["funny-modern-03", "social-media", "Yo mama liked her own post and thanked herself in the comments."],
  ["funny-modern-04", "gaming", "Yo mama customised her avatar for two hours and forgot to play."],
  ["funny-modern-05", "wi-fi", "Yo mama named her Wi-Fi ‘Loading’ so nobody knows when it works."],

  // Group-chat worthy
  ["funny-chat-01", "group-chat", "Yo mama types ‘quick question’ and sends a table of contents."],
  ["funny-chat-02", "group-chat", "Yo mama reacts to every message like she’s judging an awards show."],
  ["funny-chat-03", "group-chat", "Yo mama left the group chat, then asked everyone where they went."],
  ["funny-chat-04", "photos", "Yo mama takes so many group photos, the moment needs a lunch break."],
  ["funny-chat-05", "voice-notes", "Yo mama’s voice note has opening credits and a post-credit scene."],

  // So bad they are good
  ["funny-groan-01", "food", "Yo mama opened a bakery because she kneaded attention."],
  ["funny-groan-02", "music", "Yo mama became a DJ just to turn her life around."],
  ["funny-groan-03", "gardening", "Yo mama told a garden joke, but nobody wanted to dig it."],
  ["funny-groan-04", "work", "Yo mama brought a ladder to work because the job had levels."],
  ["funny-groan-05", "coffee", "Yo mama argues with decaf because it never makes a strong point."],
]);

export const savageJokes = makeJokes("savage", [
  // Savage but clever
  ["savage-clever-01", "confidence", "Yo mama has the confidence of a headline and the substance of a typo."],
  ["savage-clever-02", "planning", "Yo mama’s five-year plan still says ‘check back tomorrow.’"],
  ["savage-clever-03", "work", "Yo mama brings so little to the table, the table asked for a refund."],
  ["savage-clever-04", "drama", "Yo mama creates so much drama, streaming services send location scouts."],
  ["savage-clever-05", "opinions", "Yo mama’s hot takes arrive frozen in the middle."],
  ["savage-clever-06", "style", "Yo mama follows every trend and still gets left on read."],

  // Brutal one-liners
  ["savage-short-01", "comebacks", "Yo mama’s comeback needs a return policy."],
  ["savage-short-02", "planning", "Yo mama misses deadlines in advance."],
  ["savage-short-03", "gaming", "Yo mama makes easy mode look ambitious."],
  ["savage-short-04", "work", "Yo mama networks by unplugging the router."],
  ["savage-short-05", "confidence", "Yo mama peaked during the loading screen."],
  ["savage-short-06", "cooking", "Yo mama could burn a cold shoulder."],

  // Battle-ready
  ["savage-battle-01", "competition", "Yo mama came to a battle of wits with terms and conditions."],
  ["savage-battle-02", "punchlines", "Yo mama’s jokes are so predictable, the audience says them first."],
  ["savage-battle-03", "comebacks", "Yo mama’s comeback had a layover and still lost its luggage."],
  ["savage-battle-04", "confidence", "Yo mama talks like a champion and scores like a participation sticker."],
  ["savage-battle-05", "rhythm", "Yo mama’s delivery is so flat, maps use it as a reference."],
  ["savage-battle-06", "competition", "Yo mama entered the arena and the scoreboard lowered its expectations."],

  // Modern sharp lines
  ["savage-modern-01", "technology", "Yo mama’s updates fix nothing and somehow need more storage."],
  ["savage-modern-02", "social-media", "Yo mama’s profile says ‘content creator’; the content says otherwise."],
  ["savage-modern-03", "streaming", "Yo mama’s personality has ads and still isn’t worth the subscription."],
  ["savage-modern-04", "work", "Yo mama’s résumé has more plot holes than a cancelled series."],
  ["savage-modern-05", "gaming", "Yo mama blames the controller in games that use a keyboard."],
  ["savage-modern-06", "dating", "Yo mama’s red flags have their own notification settings."],

  // Comeback material
  ["savage-comeback-01", "lateness", "Yo mama’s point arrived after everyone had gone home."],
  ["savage-comeback-02", "messy", "Yo mama’s argument is so messy, even the excuses need labels."],
  ["savage-comeback-03", "confidence", "Yo mama mistakes volume for evidence and echoes for applause."],
  ["savage-comeback-04", "planning", "Yo mama thinks outside the box because she lost the instructions."],
  ["savage-comeback-05", "work", "Yo mama’s teamwork is watching everyone else become a team."],
  ["savage-comeback-06", "punchlines", "Yo mama’s punchline landed safely—nowhere near the audience."],
]);

export const hubJokes = makeJokes("modern", [
  ["hub-slow-01", "slow", "Yo mama so slow, her shortcut comes with an overnight stay."],
  ["hub-old-01", "old", "Yo mama so old, her throwback photos are in black and white naturally."],
  ["hub-forgetful-01", "forgetful", "Yo mama so forgetful, she searches for her phone using her phone."],
  ["hub-messy-01", "messy", "Yo mama so messy, her clean-up playlist gave up first."],
  ["hub-broke-01", "broke", "Yo mama so broke, her piggy bank is accepting donations."],
  ["hub-cooking-01", "cooking", "Yo mama’s cooking is so risky, the oven wears safety goggles."],
  ["hub-tech-01", "technology", "Yo mama’s browser has so many tabs, it qualifies as office space."],
  ["hub-work-01", "work", "Yo mama schedules so many check-ins, productivity checked out."],
  ["hub-social-01", "social-media", "Yo mama refreshes her feed so often, the posts get dizzy."],
  ["hub-gaming-01", "gaming", "Yo mama’s strategy guide has a chapter called ‘panic.’"],
  ["hub-dramatic-01", "dramatic", "Yo mama so dramatic, ordering lunch becomes a season finale."],
  ["hub-late-01", "lateness", "Yo mama so late, the after-party sent a search party."],
  ["hub-ugly-01", "awkward", "Yo mama’s passport photo asked for another take."],
  ["hub-short-01", "short", "Yo mama puts the pro in procrastination."],
  ["hub-short-02", "short", "Yo mama makes silence feel well prepared."],
  ["hub-short-03", "short", "Yo mama’s alarm clock needs an alarm clock."],
  ["hub-classic-01", "classic", "Yo mama so clumsy, she slipped on a thought."],
  ["hub-classic-02", "classic", "Yo mama so loud, the echo asked for personal space."],
  ["hub-classic-03", "classic", "Yo mama so lazy, she hired a stunt double to yawn."],
  ["hub-modern-01", "modern", "Yo mama’s cloud storage has weather warnings."],
  ["hub-modern-02", "modern", "Yo mama scrolls so far, her thumb gets travel points."],
  ["hub-modern-03", "modern", "Yo mama’s smartwatch keeps asking if she’s still watching."],
  ["hub-theme-01", "dating", "Yo mama brings a spreadsheet to speed dating and still runs over time."],
  ["hub-theme-02", "money", "Yo mama’s budget has more fiction than the library."],
]);

export const quickRoasts = makeJokes("classic", [
  ["roast-quick-01", "slow", "Yo mama so slow, stop signs turn green out of pity."],
  ["roast-quick-02", "broke", "Yo mama so broke, her wallet has an echo chamber."],
  ["roast-quick-03", "forgetful", "Yo mama so forgetful, she makes notes to read her notes."],
  ["roast-quick-04", "dramatic", "Yo mama so dramatic, she narrates buffering."],
  ["roast-quick-05", "cooking", "Yo mama so bad at cooking, cereal comes with a warning label."],
  ["roast-quick-06", "work", "Yo mama works so slowly, Monday laps her twice."],
  ["roast-quick-07", "gaming", "Yo mama’s gaming reflexes arrive by standard shipping."],
  ["roast-quick-08", "messy", "Yo mama’s desk is where organisation goes missing."],
  ["roast-quick-09", "technology", "Yo mama’s tech support starts with ‘have you tried guessing?’"],
  ["roast-quick-10", "lateness", "Yo mama so late, the deadline became a historical landmark."],
  ["roast-quick-11", "social-media", "Yo mama posts drafts and saves the finished thoughts for never."],
  ["roast-quick-12", "confidence", "Yo mama enters every room like applause is buffering."],
]);

export const specialistCollections = {
  "best-yo-mama-jokes": bestJokes,
  "funny-yo-mama-jokes": funnyJokes,
  "savage-yo-mama-jokes": savageJokes,
} as const;

export const allEditorialJokes = [...bestJokes, ...funnyJokes, ...savageJokes, ...hubJokes, ...quickRoasts];
