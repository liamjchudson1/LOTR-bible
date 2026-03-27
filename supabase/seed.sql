-- ─── Fellowship of the Word — Seed Data ──────────────────────────────────────
-- Run after schema.sql. Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).

-- ─── Campaigns ───────────────────────────────────────────────────────────────

insert into campaigns (id, title, slug, duration_days, biblical_content, lotr_arc, is_active) values
  ('there-and-back-again', 'There & Back Again', 'there-and-back-again', 365, 'Full Bible', 'Bilbo''s journey — the unexpected calling, return, and rest', true),
  ('the-fellowship', 'The Fellowship', 'the-fellowship', 90, 'New Testament', 'Fellowship forms, fractures, and holds — discipleship and community', true),
  ('the-long-defeat', 'The Long Defeat', 'the-long-defeat', 40, 'Psalms & Job', 'Elven grief — faith that endures without seeing resolution', true),
  ('return-of-the-king', 'The Return of the King', 'return-of-the-king', 30, 'Revelation', 'The final war, the restoration, the arrival of the King', true),
  ('wisdom-of-rivendell', 'Wisdom of Rivendell', 'wisdom-of-rivendell', 31, 'Proverbs & Ecclesiastes', 'The counsel of Elrond — slow wisdom, long perspective', true),
  ('the-rangers-road', 'The Ranger''s Road', 'the-rangers-road', 60, 'Epistles of Paul', 'Aragorn''s hidden years — perseverance in unseen faithfulness', true)
on conflict (id) do nothing;

-- ─── LOTR Locations ──────────────────────────────────────────────────────────

insert into lotr_locations (id, name, map_x, map_y, campaign_id, unlock_day, description, emoji) values
  -- The Fellowship campaign
  ('loc-shire', 'The Shire', 120, 340, 'the-fellowship', 1, 'The quiet land of hobbits — comfortable, green, and utterly unprepared for the road ahead. Every great journey begins somewhere ordinary.', '🌿'),
  ('loc-bree', 'Bree', 200, 300, 'the-fellowship', 2, 'A crossroads town, part of two worlds. Here, Strider appears from the shadows — and nothing is as it seems.', '🏘️'),
  ('loc-weathertop', 'Weathertop', 270, 270, 'the-fellowship', 3, 'The ruins of Amon Sûl — a place of ancient watching, and of wounding. The road grows dangerous here.', '⚔️'),
  ('loc-rivendell', 'Rivendell', 340, 230, 'the-fellowship', 4, 'The Last Homely House east of the Sea. A place of healing, counsel, and the forging of unlikely fellowships.', '🏛️'),
  ('loc-moria', 'Moria', 420, 290, 'the-fellowship', 5, 'The vast Dwarven realm, dark and treacherous. The Fellowship must walk through what cannot be walked around.', '🕯️'),
  ('loc-lothlorien', 'Lothlórien', 480, 330, 'the-fellowship', 6, 'The Golden Wood — a place outside of time, held in the memory of the Elves. Rest here, and see clearly.', '✨'),
  ('loc-rauros', 'Rauros', 530, 380, 'the-fellowship', 7, 'The great falls where the Fellowship breaks. Loss is not failure. The mission continues.', '💧'),
  ('loc-fangorn', 'Fangorn', 400, 380, 'the-fellowship', 14, 'The ancient forest, old as memory. The Ents have been silent too long. There are voices that must finally speak.', '🌳'),
  ('loc-edoras', 'Edoras', 370, 430, 'the-fellowship', 21, 'The hall of the Horse-lords, half-asleep under a dark counsel. Kings can be restored. Nations can wake.', '🐎'),
  ('loc-helms-deep', 'Helm''s Deep', 340, 460, 'the-fellowship', 28, 'The fortress where all seems lost at midnight. The dawn comes. It always comes.', '🏰'),
  ('loc-isengard', 'Isengard', 320, 390, 'the-fellowship', 35, 'The ruined ring of Saruman — industry turned to ruin. What is built against life does not last.', '⚙️'),
  ('loc-minas-tirith', 'Minas Tirith', 490, 450, 'the-fellowship', 49, 'The White City, the last great bastion. The King returns. The siege will not hold forever.', '🏯'),
  ('loc-mount-doom', 'Mount Doom', 570, 430, 'the-fellowship', 77, 'Orodruin — the fire where the Ring was forged, and where it must end. This is where the story was always going.', '🌋'),
  ('loc-grey-havens', 'The Grey Havens', 80, 310, 'the-fellowship', 90, 'The shore from which some sail West. The ending is not an ending. The sea is not the end.', '⛵'),
  -- The Long Defeat campaign
  ('loc-sinai', 'Mount Sinai', 300, 200, 'the-long-defeat', 1, 'The mountain of the Law, of encounter, of fire and cloud. God speaks from places that terrify.', '⛰️'),
  ('loc-wilderness', 'The Wilderness', 380, 250, 'the-long-defeat', 8, 'Forty years of wandering, forty days of Psalms. The desert is not emptiness — it is formation.', '🏜️'),
  ('loc-valley-shadow', 'Valley of the Shadow', 450, 320, 'the-long-defeat', 20, 'The dark valley of Psalm 23 — walked, not merely mentioned. The Shepherd goes through it with you.', '🌑'),
  ('loc-house-of-lord', 'The House of the Lord', 350, 380, 'the-long-defeat', 40, 'The destination that was always real. Goodness and mercy follow all the days. You arrive.', '🕊️')
on conflict (id) do nothing;

-- ─── Quests: The Fellowship (Days 1–7) ───────────────────────────────────────

insert into quests (id, campaign_id, day_number, title, lotr_location_id, scripture_ref, scripture_text, lore_connection, reflection_prompt, xp_reward, memory_verse) values
  (
    'fellowship-day-1', 'the-fellowship', 1, 'The Unexpected Journey Begins', 'loc-shire',
    'Matthew 1–3',
    'A record of the genealogy of Jesus Christ the son of David, the son of Abraham... And she will give birth to a son, and you are to give him the name Jesus, because he will save his people from their sins.',
    'Frodo does not seek the Ring. It finds him — through Bilbo, through Gandalf, through a long chain of providence he cannot see. Matthew opens the same way: a genealogy of unlikely people, converging on One. Forty-two generations. Rahab. Ruth. Bathsheba. Tamar. This is not a list of the worthy — it is a record of how God works through the broken and the ordinary. The story was moving long before you entered it.',
    'Matthew begins with a genealogy — an unbroken thread from Abraham to Christ. What in your own history feels like preparation you didn''t notice at the time?',
    155,
    'She will give birth to a son, and you are to give him the name Jesus, because he will save his people from their sins. — Matthew 1:21'
  ),
  (
    'fellowship-day-2', 'the-fellowship', 2, 'Into the Wild', 'loc-bree',
    'Matthew 4–7',
    'Jesus was led by the Spirit into the wilderness to be tempted by the devil... Blessed are the poor in spirit, for theirs is the kingdom of heaven.',
    'In Bree, Frodo meets Strider — a ranger who looks like a vagrant, smells of the road, and is watching them from the corner. He is not what he appears. No one in Bree knows he is the heir of Isildur. The Sermon on the Mount works the same way: it looks like a collection of blessings for the defeated. The poor in spirit. The mourners. The meek. In the Kingdom, the categories are inverted.',
    'The Beatitudes describe the Kingdom as an upside-down realm. Which beatitude sits most uncomfortably with you today?',
    155,
    'Blessed are the pure in heart, for they will see God. — Matthew 5:8'
  ),
  (
    'fellowship-day-3', 'the-fellowship', 3, 'Signs and Wonders on the Road', 'loc-weathertop',
    'Matthew 8–11',
    'When Jesus heard this, he was astonished and said to those following him, ''I tell you the truth, I have not found anyone in Israel with such great faith.''',
    'Weathertop is where the Nazgûl wound Frodo — a blade-tip broken off in his shoulder, working its way toward his heart. Matthew 8–11 is relentless movement: healings, storms, demons, and the commissioning of twelve. But it is also where opposition forms. John the Baptist, from prison, asks: ''Are you the one who was to come?'' Even those closest to the fire can carry doubt.',
    'John the Baptist — the one who baptised Jesus — asked from prison if Jesus was really the One. What question do you carry in your own darkness?',
    155,
    'Come to me, all you who are weary and burdened, and I will give you rest. — Matthew 11:28'
  ),
  (
    'fellowship-day-4', 'the-fellowship', 4, 'The Council of Many Voices', 'loc-rivendell',
    'Matthew 12–15',
    'He replied to him, ''Who is my mother, and who are my brothers?'' Pointing to his disciples, he said, ''Here are my mother and my brothers.''',
    'The Council of Elrond does not gather the mighty and the prepared. It gathers the reluctant, the grieving, the proud, and the suspicious. And from this fractious gathering, a fellowship is forged — not because everyone agreed, but because the mission was larger than any of them. Jesus redefines family in Matthew 12–15: his mother and brothers are those who do the will of his Father.',
    'Jesus says those who do his Father''s will are his family. What does that mean for how you treat other believers — especially the ones you find difficult?',
    155,
    'For whoever does the will of my Father in heaven is my brother and sister and mother. — Matthew 12:50'
  ),
  (
    'fellowship-day-5', 'the-fellowship', 5, 'Through the Darkness', 'loc-moria',
    'Matthew 16–18',
    'From that time on Jesus began to explain to his disciples that he must go to Jerusalem and suffer many things at the hands of the elders, chief priests and teachers of the law, and that he must be killed and on the third day be raised to life.',
    'In Moria, there is no other way. The Fellowship must go through the dark, not around it. Gandalf leads them in — and does not come out. The death of Gandalf the Grey is not the end. It is the passage. Matthew 16–18 is the pivot of the Gospel: Peter confesses who Jesus is, and in the same breath, refuses the cross. ''Get behind me, Satan.''',
    'Peter was the first to confess Jesus as Messiah — and the first to refuse the cross. Where do you want the glory of Christ without the cost of following him?',
    155,
    'For whoever wants to save their life will lose it, but whoever loses their life for me will find it. — Matthew 16:25'
  ),
  (
    'fellowship-day-6', 'the-fellowship', 6, 'Rest and Counsel', 'loc-lothlorien',
    'Matthew 19–22',
    'Jesus replied: ''Love the Lord your God with all your heart and with all your soul and with all your mind. This is the first and greatest commandment.''',
    'Lothlórien exists slightly outside the world — a place where time moves differently, where grief is held without being swallowed by it. Matthew 19–22 is Jesus in dialogue about the great commandment. When asked which law is greatest, he does not give a rule — he gives a love.',
    'Jesus said all the law hangs on loving God and neighbour. Which of those two do you find easier? What would it look like this week to actively grow in the harder one?',
    155,
    'Love the Lord your God with all your heart and with all your soul and with all your mind. — Matthew 22:37'
  ),
  (
    'fellowship-day-7', 'the-fellowship', 7, 'The Breaking of the Fellowship', 'loc-rauros',
    'Matthew 23–26',
    'Then Jesus went with his disciples to a place called Gethsemane, and he said to them, ''Sit here while I go over there and pray.''... ''My Father, if it is possible, may this cup be taken from me. Yet not as I will, but as you will.''',
    'At Rauros, Boromir falls — not to darkness but through it, and his final words are among the most honest in Tolkien: ''I am sorry. I have paid.'' The Fellowship breaks. Frodo goes alone, as he must. Gethsemane is the same kind of moment: a garden, a night, a prayer that the cup might pass — and the only answer is the cross.',
    'Jesus prays ''not as I will, but as you will'' — full honesty about what he wanted, full surrender to the Father. What are you most reluctant to surrender to God''s will right now?',
    155,
    'My Father, if it is possible, may this cup be taken from me. Yet not as I will, but as you will. — Matthew 26:39'
  )
on conflict (campaign_id, day_number) do nothing;

-- ─── Quests: The Long Defeat (Days 1–7) ──────────────────────────────────────

insert into quests (id, campaign_id, day_number, title, lotr_location_id, scripture_ref, scripture_text, lore_connection, reflection_prompt, xp_reward, memory_verse) values
  (
    'long-defeat-day-1', 'the-long-defeat', 1, 'The Weight of the World', 'loc-sinai',
    'Psalm 1–2',
    'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the Lord.',
    'Galadriel speaks of ''the long defeat'' — the grief of watching things you love be diminished across the ages. Psalm 1 opens with a picture of the person who endures: not the triumphant, but the rooted. A tree by water. Not swept away in the storm.',
    'Psalm 1 describes the blessed person as rooted, not restless. Where in your life do you feel most like chaff — driven by winds you can''t control?',
    155,
    'That person is like a tree planted by streams of water, which yields its fruit in season. — Psalm 1:3'
  ),
  (
    'long-defeat-day-2', 'the-long-defeat', 2, 'Enemies Without and Within', 'loc-sinai',
    'Psalm 3–7',
    'Lord, how many are my foes! How many rise up against me! Many are saying of me, ''God will not deliver him.'' But you, Lord, are a shield around me, my glory, the One who lifts my head high.',
    'Tolkien knew that the long defeat is not a single catastrophic loss — it is the accumulated weight of enemies that never stop coming. Psalm 3 is David''s prayer while fleeing from his own son. And yet: ''I lie down and sleep; I wake again, because the Lord sustains me.'' Sleep in the midst of threat is an act of trust.',
    'David could sleep while fleeing for his life because he trusted God as his shield. What keeps you awake at night?',
    155,
    'I lie down and sleep; I wake again, because the Lord sustains me. — Psalm 3:5'
  ),
  (
    'long-defeat-day-3', 'the-long-defeat', 3, 'The Cry That Goes Unanswered', 'loc-sinai',
    'Psalm 10–13',
    'How long, Lord? Will you forget me forever? How long will you hide your face from me? How long must I wrestle with my thoughts and day after day have sorrow in my heart?',
    'The Elves have a word for grief that carries beauty within it — the kind of sorrow that does not pretend things are fine. Psalm 13 is only six verses, but it contains the whole of human suffering compressed into a question: How long? The psalm does not resolve with an answer — it resolves with a choice. ''But I trust in your unfailing love.''',
    'Psalm 13''s ''How long?'' is one of the most honest prayers in Scripture. What ''how long'' question are you carrying right now?',
    155,
    'But I trust in your unfailing love; my heart rejoices in your salvation. — Psalm 13:5'
  ),
  (
    'long-defeat-day-4', 'the-long-defeat', 4, 'The Shepherd in the Dark Valley', 'loc-wilderness',
    'Psalm 22–23',
    'My God, my God, why have you forsaken me? Why are you so far from saving me, so far from my cries of anguish?... Even though I walk through the darkest valley, I will fear no evil, for you are with me.',
    'Psalm 22 begins where the cross begins. Jesus prays this from the cross — not as a quotation but as a genuine cry. And the psalm ends in vindication. Psalm 23 follows — not as a contradiction but as a companion. The Shepherd does not remove the dark valley; he walks through it with you.',
    'Psalm 22 and 23 sit side by side — abandonment and presence. Which psalm feels more true to your life right now?',
    155,
    'Even though I walk through the darkest valley, I will fear no evil, for you are with me. — Psalm 23:4'
  ),
  (
    'long-defeat-day-5', 'the-long-defeat', 5, 'Longing for the House of God', 'loc-wilderness',
    'Psalm 42–43',
    'As the deer pants for streams of water, so my soul pants for you, my God. My soul thirsts for God, for the living God. When can I go and meet with God?',
    'The Elves of Rivendell sing songs of longing — for Valinor, for the Undying Lands, for a home that exists but cannot be reached yet. Psalm 42 is the same ache: the soul thirsts for God the way a deer thirsts for water. Three times the psalm asks ''why are you downcast, O my soul?'' Three times it answers with hope.',
    'The psalmist preaches to himself: ''Why, my soul, are you downcast? Put your hope in God.'' What is your soul most downcast about today?',
    155,
    'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God. — Psalm 42:5'
  ),
  (
    'long-defeat-day-6', 'the-long-defeat', 6, 'The Ancient Mercy', 'loc-valley-shadow',
    'Psalm 90–91',
    'Lord, you have been our dwelling place throughout all generations. Before the mountains were born or you brought forth the whole world, from everlasting to everlasting you are God.',
    'Psalm 90 is attributed to Moses — the oldest psalm, written by a man who saw the burning bush and never entered the Promised Land. ''A thousand years in your sight are like a watch in the night.'' And yet the dwelling place of the people of God is not a land or a building — it is God himself.',
    'Moses, who never reached the Promised Land, describes God as his ''dwelling place throughout all generations.'' Where do you look for security that is not God himself?',
    155,
    'Lord, you have been our dwelling place throughout all generations. — Psalm 90:1'
  ),
  (
    'long-defeat-day-7', 'the-long-defeat', 7, 'The Everlasting Arms', 'loc-valley-shadow',
    'Psalm 103–104',
    'Praise the Lord, my soul, and forget not all his benefits — who forgives all your sins and heals all your diseases, who redeems your life from the pit and crowns you with love and compassion.',
    'Psalm 103 is the antidote to the long defeat — not because it denies the grief, but because it remembers. ''Forget not all his benefits.'' Memory is the weapon against despair. To remember what God has done is not to pretend the present is fine. It is to locate the present inside a larger story.',
    'Psalm 103 calls us to actively remember God''s benefits. Spend time today listing specific things God has done in your life — forgiveness, healing, rescue.',
    155,
    'He does not treat us as our sins deserve or repay us according to our iniquities. — Psalm 103:10'
  )
on conflict (campaign_id, day_number) do nothing;

-- ─── Level Gates (applied on top of quest inserts) ───────────────────────────
-- Days 5 and 7 have gates from the initial Fellowship seed above.
-- Days 28, 49, and 77 will be set when those quests are inserted.

update quests set
  min_level = 2,
  level_gate_title = 'The Mines Demand More',
  level_gate_description = 'Moria is not merely dark — it is old, and it remembers. The cave troll does not yield to those still finding their footing. Before you descend, you must be a Traveller: someone who has shown they can carry the road. Keep walking until you are.'
where id = 'fellowship-day-5';

update quests set
  min_level = 3,
  level_gate_title = 'The Breaking Cannot Be Rushed',
  level_gate_description = 'At Rauros, the Fellowship does not simply scatter — it chooses. Boromir falls. Frodo goes alone. This is not a moment for the new. Only a Ranger of the North has learned enough about faithfulness under pressure to understand what is actually happening here — and why it had to.'
where id = 'fellowship-day-7';

update quests set
  min_level = 4,
  level_gate_title = 'The Wall Holds Only the Sworn',
  level_gate_description = 'Helm''s Deep is fought by people who have no reason for hope except duty. You cannot stand at that wall unless you have sworn something — unless your faithfulness has been tested and held. A Knight of Gondor does not fight because they expect to win. They fight because they were made to stand.'
where id = 'fellowship-day-28';

update quests set
  min_level = 5,
  level_gate_title = 'The Beacons Are Not For Everyone',
  level_gate_description = 'The beacons of Gondor call for riders — not wanderers. The Siege of Minas Tirith is a chapter that rewards those who have answered smaller calls faithfully. A Rider of Rohan doesn''t wait to feel ready. But they have already learned to ride.'
where id = 'fellowship-day-49';

update quests set
  min_level = 7,
  level_gate_title = 'Only the Loremaster Carries This',
  level_gate_description = 'Mount Doom is not a place of triumph. It is a place of exhaustion, temptation, and a mercy that neither Frodo nor Gollum understood. You cannot walk into Orodruin''s fire unless you have sat long enough in the Word to know what it costs to carry something all the way to the end. The Loremaster''s road leads here. Not the hero''s.'
where id = 'fellowship-day-77';

-- ─── Artefacts ────────────────────────────────────────────────────────────────

insert into artefacts (id, name, description, emoji, unlock_condition, unlock_value) values
  ('sting', 'Sting', 'The small blade that glows blue in darkness. Seven faithful days, and the darkness retreats.', '🗡️', 'streak', 7),
  ('phial-of-galadriel', 'Phial of Galadriel', 'A light when all other lights go out. Complete the Psalms track and carry this into the dark.', '💎', 'complete_campaign', 1),
  ('mithril-coat', 'Mithril Coat', 'Worth more than the Shire. Forged in fellowship — all members active in a single week.', '🛡️', 'fellowship_week', 1),
  ('the-one-ring', 'The One Ring', 'A burden and a prize. Complete a full campaign and bear what others could not.', '💍', 'complete_any_campaign', 1),
  ('glamdring', 'Glamdring', 'The Foe-hammer, sword of Gandalf. Reach level 5 and you carry the light of the Istari.', '⚔️', 'level', 5),
  ('anduril', 'Andúril', 'Reforged from the shards of Narsil. Thirty days of faithfulness, and the blade is remade.', '🔱', 'streak', 30),
  ('lembas-bread', 'Lembas Bread', 'One small bite fills the stomach of a grown man. Complete fifty daily habits — sustained beyond your own strength.', '🍞', 'total_habits', 50),
  ('the-silmarils', 'The Silmarils', 'The greatest treasures of Arda — light imprisoned in jewels. Complete every campaign and hold the light of the Trees.', '🌟', 'all_campaigns', 6)
on conflict (id) do nothing;
