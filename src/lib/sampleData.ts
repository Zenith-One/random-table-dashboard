import type { RandomTable, Dashboard } from './types';

export const sampleTables: RandomTable[] = [
	{
		id: 'weather-1',
		name: 'Weather Table',
		description: 'Random weather conditions for your adventure',
		diceFormula: '1d8',
		entries: [
			{ id: '1', columns: ['Clear skies and sunshine'] },
			{ id: '2', columns: ['Partly cloudy with a gentle breeze'] },
			{ id: '3', columns: ['Overcast with occasional drizzle'] },
			{ id: '4', columns: ['Heavy rain with thunder'] },
			{ id: '5', columns: ['Foggy and mysterious'] },
			{ id: '6', columns: ['Light snow falling gently'] },
			{ id: '7', columns: ['Fierce windstorm'] },
			{ id: '8', columns: ['Magical aurora in the sky'] }
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'npc-personality-1',
		name: 'NPC Personality Trait',
		description: 'Generate a quick personality trait for an NPC',
		entries: [
			{ id: '1', columns: ['Overly friendly and talkative'] },
			{ id: '2', columns: ['Suspicious and paranoid'] },
			{ id: '3', columns: ['Cheerful and optimistic'] },
			{ id: '4', columns: ['Grumpy and pessimistic'] },
			{ id: '5', columns: ['Mysterious and cryptic'] },
			{ id: '6', columns: ['Nervous and jittery'] },
			{ id: '7', columns: ['Calm and collected'] },
			{ id: '8', columns: ['Eccentric and peculiar'] }
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'tavern-event-1',
		name: 'Tavern Events',
		description: 'What\'s happening at the tavern tonight?',
		diceFormula: '1d10',
		entries: [
			{ id: '1', columns: ['A bard performs an epic ballad'] },
			{ id: '2', columns: ['Two patrons get into a fistfight'] },
			{ id: '3', columns: ['A mysterious hooded figure sits alone in the corner'] },
			{ id: '4', columns: ['The tavern is hosting a drinking contest'] },
			{ id: '5', columns: ['A group of off-duty guards share war stories'] },
			{ id: '6', columns: ['Someone is cheating at cards'] },
			{ id: '7', columns: ['The innkeeper is celebrating their birthday'] },
			{ id: '8', columns: ['A traveling merchant offers exotic goods'] },
			{ id: '9', columns: ['Locals discuss rumors of nearby treasure'] },
			{ id: '10', columns: ['A magical accident causes minor chaos'] }
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'treasure-1',
		name: 'Treasure Hoard',
		description: 'Random treasure with multiple attributes',
		diceFormula: '1d10',
		columnHeaders: ['Item', 'Value', 'Rarity'],
		entries: [
			{ id: '1', columns: ['Ancient Sword', '500 GP', 'Uncommon'] },
			{ id: '2', columns: ['Healing Potion', '50 GP', 'Common'] },
			{ id: '3', columns: ['Ring of Protection', '2000 GP', 'Rare'] },
			{ id: '4', columns: ['Bag of Gold Coins', '100 GP', 'Common'] },
			{ id: '5', columns: ['Magic Wand', '1500 GP', 'Rare'] },
			{ id: '6', columns: ['Silver Necklace', '250 GP', 'Uncommon'] },
			{ id: '7', columns: ['Spell Scroll', '300 GP', 'Uncommon'] },
			{ id: '8', columns: ['Enchanted Shield', '3000 GP', 'Very Rare'] },
			{ id: '9', columns: ['Gemstone Collection', '750 GP', 'Uncommon'] },
			{ id: '10', columns: ['Legendary Artifact', '10000 GP', 'Legendary'] }
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

export const sampleDashboards: Dashboard[] = [
	{
		id: 'adventure-start-1',
		name: 'Adventure Start',
		description: 'Essential tables for starting a new adventure',
		tableIds: ['weather-1', 'tavern-event-1', 'treasure-1'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 'npc-generator-1',
		name: 'NPC Generator',
		description: 'Quick NPC generation tools',
		tableIds: ['npc-personality-1'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];
