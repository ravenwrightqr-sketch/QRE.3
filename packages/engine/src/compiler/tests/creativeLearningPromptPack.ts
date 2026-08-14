export type CreativeLearningPrompt = {
  id: number;
  category: string;
  prompt: string;
  memory?: string;
};

/**
 * Human-readable prompt pack for training/evaluating QRE's creative author.
 *
 * These prompts deliberately mix ordinary facts with strong narrative invitations.
 * Personal-memory prompts are phrased so the runtime can inject the user's actual
 * stored memories rather than hard-coding private biographical facts into tests.
 */
export const CREATIVE_LEARNING_PROMPTS: CreativeLearningPrompt[] = [
  { id: 1, category: "wedding-romance", prompt: "The wedding is tonight. Everyone knows the couple, but nobody knows what happens after the vows. Make it romantic, cinematic, and intimate." },
  { id: 2, category: "wedding-romance", prompt: "The bride fixed one tiny detail on the groom's jacket just before they walked in. Make that detail carry the emotional weight of the whole wedding." },
  { id: 3, category: "wedding-romance", prompt: "Two people who already know everything about each other are getting married anyway. Write the moment so it feels like a beginning, not a conclusion." },
  { id: 4, category: "wedding-romance", prompt: "The reception gets loud, but the couple keeps finding each other's eyes across the room. Make that quiet connection the story." },
  { id: 5, category: "wedding-memory", prompt: "At a wedding, an old photograph falls from a drawer and changes how one family remembers the couple. Build a reveal without inventing facts." },
  { id: 6, category: "wedding-comedy", prompt: "Everything about the wedding is beautiful except the one tiny thing that keeps going wrong. Make the flaw become the favorite memory." },
  { id: 7, category: "wedding-cinematic", prompt: "The last person leaves the reception. The lights are still on. Write the after-image of the wedding in a way that feels almost like a film ending." },
  { id: 8, category: "wedding-tender", prompt: "The vows are over. Nobody knows what to say for one second. Let that silence become the most romantic part." },
  { id: 9, category: "wedding-mystery", prompt: "The wedding photographer notices one person in the background of every photograph. Nobody remembers seeing them." },
  { id: 10, category: "wedding-comedy", prompt: "The couple wanted a perfect wedding. The real memory turns out to be the one ridiculous thing nobody could plan." },

  { id: 11, category: "horror", prompt: "The hotel room looked ordinary until the old photograph above the desk was noticed. Then the lights flickered. Make the horror slow, specific, and unavoidable." },
  { id: 12, category: "horror", prompt: "A room is completely safe until one object seems slightly out of place. Do not reveal why immediately." },
  { id: 13, category: "horror", prompt: "Someone hears their own footsteps from the room behind them. They are standing still." },
  { id: 14, category: "horror", prompt: "The camera recorded the first dance, the toast, and a stranger laughing in the back row. Nobody remembers inviting them." },
  { id: 15, category: "horror", prompt: "A family returns to the same beach every year. One year the tide gives something back that should still be somewhere else." },
  { id: 16, category: "horror", prompt: "A housekeeper finishes a room and notices one thing she definitely did not move. The room is otherwise perfect." },
  { id: 17, category: "horror", prompt: "Someone finds a ticket inside an old coat pocket. The date is tomorrow." },
  { id: 18, category: "horror", prompt: "The wedding video contains a few seconds that nobody remembers happening. Make the discovery scarier than the event." },
  { id: 19, category: "horror", prompt: "A child draws a room exactly as it looks, including a person the adults insist is not there." },
  { id: 20, category: "horror", prompt: "A porch light keeps turning on even though the house has been empty for years." },

  { id: 21, category: "fictional-chaos", prompt: "Three armed clowns accidentally arrive at the wrong birthday party. Keep it clearly fictional, absurd, and non-graphic; make the tension come from social chaos." },
  { id: 22, category: "fictional-chaos", prompt: "A fake armed-clown wedding security team takes its job far too seriously. Make the scene ridiculous rather than violent." },
  { id: 23, category: "fictional-chaos", prompt: "The parade includes an ominous clown with a toy prop that everyone mistakes for something dangerous. Build suspense and then land a ridiculous payoff." },
  { id: 24, category: "fictional-chaos", prompt: "A clown gang storms the wrong building in a completely fictional comedy and discovers it is a meditation retreat." },
  { id: 25, category: "fictional-chaos", prompt: "A fake crime movie is being filmed at a beach when the clown extras start improvising. Turn the chaos into comedy." },
  { id: 26, category: "fictional-chaos", prompt: "A terrifying clown arrives at a children's party, but the children immediately decide the clown needs help. Make the reversal funny and warm." },
  { id: 27, category: "fictional-chaos", prompt: "A fictional clown heist goes wrong because the crew keeps getting distracted by party favors. Make the escalating failures increasingly absurd." },
  { id: 28, category: "fictional-chaos", prompt: "A masked clown appears in the background of a wedding photo and everyone starts blaming everyone else for inviting them." },
  { id: 29, category: "fictional-chaos", prompt: "An armed-clown movie poster is found in an old attic. The real story is that someone is using it as a terrible disguise for a surprise party." },
  { id: 30, category: "fictional-chaos", prompt: "A fake apocalypse parade is led by clowns carrying absurd props. Make it theatrical, ridiculous, and unexpectedly charming." },

  { id: 31, category: "romance", prompt: "Two people miss the sunset but stay on the beach anyway. Make the missed sunset feel like a better ending." },
  { id: 32, category: "romance", prompt: "Someone keeps pretending not to be impressed, but one tiny gesture gives them away." },
  { id: 33, category: "romance", prompt: "A couple returns to a place they visited when they first met. The place is nearly unchanged; they are not." },
  { id: 34, category: "romance", prompt: "One person remembers a small detail from years ago that the other person forgot. Make the memory feel intimate rather than sentimental." },
  { id: 35, category: "romance", prompt: "A late-night drive ends with no grand declaration, just a moment that makes both people know something has changed." },
  { id: 36, category: "romance", prompt: "They keep arguing about where to sit at the restaurant, then discover they were both trying to give the other the better view." },
  { id: 37, category: "romance", prompt: "Write a romantic scene where the most important thing is something neither person says." },
  { id: 38, category: "romance", prompt: "A couple laughs at exactly the wrong moment during a serious occasion. Make the laughter become a private bond." },
  { id: 39, category: "romance", prompt: "The old chair stayed through three summers and two different dogs. Let the object carry the romance." },
  { id: 40, category: "romance", prompt: "The best romantic memory from a trip turns out to be the boring ten minutes between the planned events." },

  { id: 41, category: "beach", prompt: "We went there again. Huntington. The pier. The sunset. Stay until the lights come on and make recurrence matter." },
  { id: 42, category: "beach", prompt: "A beach day begins as a simple outing and becomes one of those memories people keep retelling." },
  { id: 43, category: "beach", prompt: "Someone loses something small in the sand and finds it years later in an unexpected context." },
  { id: 44, category: "beach", prompt: "The ocean looks different at night. Write the same beach as if it has become a completely different world." },
  { id: 45, category: "beach", prompt: "A group stays on the beach after everyone else leaves. Make the empty shoreline become part of the memory." },
  { id: 46, category: "beach", prompt: "A beach picnic goes slightly wrong, but years later everyone remembers the mistake more fondly than the plan." },
  { id: 47, category: "beach", prompt: "Write a cinematic memory of wet footprints disappearing while someone keeps walking." },
  { id: 48, category: "beach", prompt: "A person returns to the same beach after a major life change and notices one detail that has not changed." },
  { id: 49, category: "beach", prompt: "The tide erases the evidence of the afternoon one line at a time. Make the erasure feel emotional." },
  { id: 50, category: "beach", prompt: "A completely ordinary beach chair becomes the anchor for a story that spans years." },

  { id: 51, category: "personal-memory", memory: "inject stored travel memories", prompt: "Use the user's stored travel memories and find a recurring pattern across places they have visited. Write it as a personal realization rather than a list." },
  { id: 52, category: "personal-memory", memory: "inject stored travel memories", prompt: "Use the user's stored memories to write about one place that keeps reappearing in their life in unexpected ways." },
  { id: 53, category: "personal-memory", memory: "inject stored event memories", prompt: "Find the strangest small detail across the user's stored memories and turn it into a callback that would make them laugh." },
  { id: 54, category: "personal-memory", memory: "inject stored travel memories", prompt: "Compare two stored trips without inventing anything. Find the emotional difference between them." },
  { id: 55, category: "personal-memory", memory: "inject stored nightlife memories", prompt: "Use the user's stored nightlife or concert memories and write a high-energy memory montage without inventing events." },
  { id: 56, category: "personal-memory", memory: "inject stored memories", prompt: "Take three unrelated stored memories and discover the hidden common thread that makes them feel like one story." },
  { id: 57, category: "personal-memory", memory: "inject stored memories", prompt: "Find a stored memory that sounded ordinary when it happened and now feels unusually important." },
  { id: 58, category: "personal-memory", memory: "inject stored memories", prompt: "Use only stored memories to write a scene that begins funny and ends unexpectedly tender." },
  { id: 59, category: "personal-memory", memory: "inject stored memories", prompt: "Write a personal time-capsule passage from the user's stored memories that future-them would want to reread." },
  { id: 60, category: "personal-memory", memory: "inject stored memories", prompt: "Make a memory feel bigger without changing any facts: use pacing, detail, contrast, and a memorable ending." },

  { id: 61, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Use the user's stored rave or concert memories and find the moment that felt most alive. Do not invent performers, venues, or events." },
  { id: 62, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Turn stored rave memories into a cinematic sequence of sound, light, movement, and aftermath while preserving factual grounding." },
  { id: 63, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Find the funniest contrast between what the user expected from a night out and what the stored memory actually records." },
  { id: 64, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Build a recurring-memory story from places, crowds, and moments the user has actually stored." },
  { id: 65, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Write an after-the-party memory where the empty streets matter as much as the event." },
  { id: 66, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Write the same stored night as comedy, then as nostalgia. Preserve all facts but radically change the interpretation." },
  { id: 67, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Find a single concrete object, sound, place, or image from stored memories and let it become the symbol of the night." },
  { id: 68, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Create a memory callback that links an earlier stored night to a later one without pretending they happened at the same time." },
  { id: 69, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Write a short piece about how a place changes after someone has returned there repeatedly." },
  { id: 70, category: "rave-memory", memory: "inject stored rave/concert memories", prompt: "Make the user's stored nightlife memories feel like a personal mythology while remaining completely factual." },

  { id: 71, category: "service-story", prompt: "Maria arrived at 9:04 AM, cleaned the kitchen and two bathrooms, and finished at 11:47 AM. Tell the story as a quiet battle for control of the house." },
  { id: 72, category: "service-story", prompt: "Use the same housekeeping facts, but write the work as a dance: repetition, rhythm, room-to-room movement, and a clean final beat." },
  { id: 73, category: "service-story", prompt: "Turn an ordinary home cleaning job into a story about invisible craftsmanship without inventing details." },
  { id: 74, category: "service-story", prompt: "A dog hated the dryer, loved the foot rub, and returned three weeks later as if the place belonged to him. Make the return the payoff." },
  { id: 75, category: "service-story", prompt: "A restaurant server handles a completely normal dinner shift. Find the hidden rhythm that makes the work interesting without inventing incidents." },
  { id: 76, category: "service-story", prompt: "A barber finishes a routine appointment. Make the transformation about confidence rather than hair, but stay grounded." },
  { id: 77, category: "service-story", prompt: "A mechanic finishes a routine repair. Write the service as a rescue mission where the final payoff is the customer's relief." },
  { id: 78, category: "service-story", prompt: "A realtor opens a front door and sunlight crosses an empty living room. Make the room feel like a future waiting to be claimed without over-selling it." },
  { id: 79, category: "service-story", prompt: "A painter finishes a room. Use color as a narrative change, but never invent a color that wasn't supplied." },
  { id: 80, category: "service-story", prompt: "Write a compelling service memory from three boring facts. The creative challenge is to find the latent story, not to add fake events." },

  { id: 81, category: "home-memory", prompt: "A home QR should remember its story across builders, owners, repairs, paint colors, upgrades, and family memories. Write a sample memory that feels useful and human." },
  { id: 82, category: "home-memory", prompt: "A homeowner photographs a paint can label. Use visual knowledge plus prior home memories to create a precise property record." },
  { id: 83, category: "home-memory", prompt: "A builder adds installation details to a home's memory. Years later the owner adds a repair. Show how the same object accumulates history." },
  { id: 84, category: "home-memory", prompt: "A room has changed owners three times. Use stored facts to tell its history without confusing one owner's memories with another's." },
  { id: 85, category: "home-memory", prompt: "The house has a cabinet with a small scratch that multiple owners remember differently. Use uncertainty honestly and make the detail interesting." },
  { id: 86, category: "home-memory", prompt: "Write a home memory that is simultaneously a useful maintenance record and a story someone would actually want to read." },
  { id: 87, category: "home-memory", prompt: "The front door has seen deliveries, holidays, moving day, and ordinary mornings. Use only supplied facts to turn it into the home's recurring character." },
  { id: 88, category: "home-memory", prompt: "A homeowner scans a QR and discovers the original builder's note about one part of the house. Make the discovery feel meaningful without inventing the note." },
  { id: 89, category: "home-memory", prompt: "The kitchen has been renovated once. Write the memory so the old and new versions coexist rather than making the old one disappear." },
  { id: 90, category: "home-memory", prompt: "Create a house-memory passage that a future owner would treasure because it preserves useful facts and one small human detail." },

  { id: 91, category: "creative-freedom", prompt: "A tiny paper ticket is found inside an old coat pocket. Nobody knows where it came from. Build mystery without inventing a definitive answer." },
  { id: 92, category: "creative-freedom", prompt: "A blue suitcase survived three airports, one missed train, and a rainy walk home. Ten years later it is still by the door. Make the object feel like a witness." },
  { id: 93, category: "creative-freedom", prompt: "A birthday cake arrives one minute before everyone starts singing, then the lights go out, then someone laughs. Build escalation and payoff." },
  { id: 94, category: "creative-freedom", prompt: "Dad plays an old guitar in the garage while everyone else packs the car. Nobody notices the song until years later. Make the delayed realization land." },
  { id: 95, category: "creative-freedom", prompt: "The concert ends at midnight, but the crowd stays in the parking lot singing while the road empties around them. Make the night feel larger without exaggerating facts." },
  { id: 96, category: "creative-freedom", prompt: "A chef brings out the final plate just as birthday candles are lit. The table goes quiet for a second. Find the story inside the silence." },
  { id: 97, category: "creative-freedom", prompt: "A routine car ride becomes memorable for one tiny observation. Do not invent a dramatic event; discover why the small thing mattered." },
  { id: 98, category: "creative-freedom", prompt: "Take an ordinary list of facts and choose one of five possible creative lenses—battle, dance, mystery, romance, or comedy. Commit to one and make the ending pay it off." },
  { id: 99, category: "creative-freedom", prompt: "Rewrite the same factual memory three ways: funny, haunting, and tender. Nothing factual may change between versions." },
  { id: 100, category: "creative-freedom", prompt: "Given any grounded memory, find the detail most likely to stay in someone's head tomorrow. Build the whole passage around that detail and finish with a line that earns a reread." },
];

export const CREATIVE_LEARNING_PROMPT_COUNT = CREATIVE_LEARNING_PROMPTS.length;

export function promptsByCategory(category: string): CreativeLearningPrompt[] {
  const normalized = category.trim().toLowerCase();
  return CREATIVE_LEARNING_PROMPTS.filter((item) => item.category.toLowerCase() === normalized);
}
