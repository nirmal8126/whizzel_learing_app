import type { Difficulty, SubjectKey } from './subjects';

export type Question = {
  q: string;
  options: string[];
  answer: number;
};

type QuestionBank = Record<SubjectKey, Record<Difficulty, Question[]>>;

export const QUESTIONS: QuestionBank = {
  math: {
    easy: [
      { q: 'What is 7 + 5?', options: ['10', '12', '13', '11'], answer: 1 },
      { q: 'What is 3 × 4?', options: ['7', '10', '12', '14'], answer: 2 },
      { q: 'What comes next: 2, 4, 6, 8, __?', options: ['9', '10', '11', '12'], answer: 1 },
      { q: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], answer: 1 },
      { q: 'What is 15 - 8?', options: ['6', '7', '8', '9'], answer: 1 },
      { q: 'Which is bigger: 1/2 or 1/4?', options: ['1/2', '1/4', 'Same', "Can't tell"], answer: 0 },
      { q: 'What is 9 + 6?', options: ['14', '15', '16', '17'], answer: 1 },
      { q: 'How many minutes are in an hour?', options: ['30', '45', '60', '90'], answer: 2 },
    ],
    medium: [
      { q: 'What is 144 ÷ 12?', options: ['10', '11', '12', '13'], answer: 2 },
      { q: 'What is 25% of 80?', options: ['15', '20', '25', '30'], answer: 1 },
      { q: 'Solve: x + 7 = 15', options: ['6', '7', '8', '9'], answer: 2 },
      { q: 'What is the square root of 81?', options: ['7', '8', '9', '10'], answer: 2 },
      { q: 'A rectangle is 6cm × 4cm. What is the area?', options: ['10 cm²', '20 cm²', '24 cm²', '28 cm²'], answer: 2 },
      { q: 'What is 3² + 4²?', options: ['20', '25', '14', '7'], answer: 1 },
      { q: 'What is 7 × 8?', options: ['54', '56', '58', '64'], answer: 1 },
      { q: 'How many degrees in a right angle?', options: ['45°', '90°', '180°', '360°'], answer: 1 },
    ],
    hard: [
      { q: 'What is 17 × 13?', options: ['201', '211', '221', '231'], answer: 2 },
      { q: 'If x² = 169, what is x?', options: ['11', '12', '13', '14'], answer: 2 },
      { q: "What's the next prime after 29?", options: ['30', '31', '33', '37'], answer: 1 },
      { q: 'What is 15% of 240?', options: ['32', '34', '36', '38'], answer: 2 },
      { q: 'Solve: 2x - 5 = 13', options: ['7', '8', '9', '10'], answer: 2 },
      { q: 'A circle has radius 7. What is its area? (use π ≈ 22/7)', options: ['144', '148', '150', '154'], answer: 3 },
      { q: 'What is the value of 2⁵?', options: ['16', '25', '32', '64'], answer: 2 },
      { q: 'Simplify: (3 + 5) × 2 - 4', options: ['10', '12', '14', '16'], answer: 1 },
    ],
  },
  science: {
    easy: [
      { q: 'What planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], answer: 1 },
      { q: 'What gas do plants breathe in?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], answer: 2 },
      { q: 'How many legs does a spider have?', options: ['6', '8', '10', '4'], answer: 1 },
      { q: 'What is the boiling point of water?', options: ['50°C', '75°C', '100°C', '150°C'], answer: 2 },
      { q: 'Which organ pumps blood?', options: ['Brain', 'Lungs', 'Heart', 'Liver'], answer: 2 },
      { q: 'What force keeps us on the ground?', options: ['Magnetism', 'Friction', 'Gravity', 'Wind'], answer: 2 },
      { q: 'Which animal lays eggs?', options: ['Cow', 'Dog', 'Chicken', 'Cat'], answer: 2 },
      { q: 'What do we call frozen water?', options: ['Steam', 'Ice', 'Mist', 'Rain'], answer: 1 },
    ],
    medium: [
      { q: "What's the chemical symbol for gold?", options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
      { q: 'How many bones are in the adult human body?', options: ['186', '206', '226', '256'], answer: 1 },
      { q: 'What type of rock is formed by cooling lava?', options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Limestone'], answer: 2 },
      { q: 'What is the speed of light (approx)?', options: ['100,000 km/s', '200,000 km/s', '300,000 km/s', '400,000 km/s'], answer: 2 },
      { q: "Which gas makes up most of Earth's atmosphere?", options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], answer: 2 },
      { q: 'What part of a cell contains DNA?', options: ['Membrane', 'Nucleus', 'Ribosome', 'Cytoplasm'], answer: 1 },
      { q: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], answer: 1 },
      { q: 'What gas do humans breathe out?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Methane'], answer: 2 },
    ],
    hard: [
      { q: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], answer: 1 },
      { q: 'What phenomenon causes rainbows?', options: ['Reflection', 'Refraction', 'Diffraction', 'Dispersion'], answer: 3 },
      { q: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi body'], answer: 2 },
      { q: "Newton's 3rd law states every action has:", options: ['Equal reaction', 'Double reaction', 'No reaction', 'Random reaction'], answer: 0 },
      { q: "What's the pH of pure water?", options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'Which planet has the Great Red Spot?', options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'], answer: 2 },
      { q: 'What is the hardest natural mineral?', options: ['Quartz', 'Topaz', 'Diamond', 'Corundum'], answer: 2 },
      { q: 'What is the unit of electric resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], answer: 2 },
    ],
  },
  language: {
    easy: [
      { q: 'Which word is a noun?', options: ['Run', 'Happy', 'Dog', 'Quickly'], answer: 2 },
      { q: "What is the opposite of 'hot'?", options: ['Warm', 'Cool', 'Cold', 'Freeze'], answer: 2 },
      { q: 'Complete: The cat ___ on the mat.', options: ['sit', 'sat', 'sits', 'sitting'], answer: 1 },
      { q: 'Which is a vowel?', options: ['B', 'C', 'D', 'E'], answer: 3 },
      { q: "What does 'enormous' mean?", options: ['Tiny', 'Fast', 'Very big', 'Slow'], answer: 2 },
      { q: "Which word rhymes with 'cat'?", options: ['Cup', 'Cap', 'Hat', 'Car'], answer: 2 },
      { q: 'How many letters in the English alphabet?', options: ['24', '25', '26', '27'], answer: 2 },
      { q: "What is the plural of 'child'?", options: ['Childs', 'Childes', 'Children', 'Childer'], answer: 2 },
    ],
    medium: [
      { q: "What is a synonym for 'brave'?", options: ['Scared', 'Courageous', 'Weak', 'Shy'], answer: 1 },
      { q: 'Which sentence has correct grammar?', options: ["She don't know", "She doesn't knows", "She doesn't know", 'She not know'], answer: 2 },
      { q: "What is the plural of 'mouse'?", options: ['Mouses', 'Mice', 'Mousies', 'Mouse'], answer: 1 },
      { q: "'Break' and 'brake' are examples of:", options: ['Synonyms', 'Antonyms', 'Homophones', 'Similes'], answer: 2 },
      { q: "What type of word is 'quickly'?", options: ['Noun', 'Verb', 'Adjective', 'Adverb'], answer: 3 },
      { q: 'Which is a compound word?', options: ['Running', 'Butterfly', 'Playing', 'Happily'], answer: 1 },
      { q: "What is the past tense of 'go'?", options: ['Goed', 'Went', 'Gone', 'Going'], answer: 1 },
      { q: "Which is an adjective in 'The red ball rolls'?", options: ['The', 'Red', 'Ball', 'Rolls'], answer: 1 },
    ],
    hard: [
      { q: "What literary device is 'The wind whispered'?", options: ['Simile', 'Metaphor', 'Personification', 'Alliteration'], answer: 2 },
      { q: "What tense is 'They will have finished'?", options: ['Past perfect', 'Future simple', 'Future perfect', 'Present perfect'], answer: 2 },
      { q: 'Which is an oxymoron?', options: ['Dark night', 'Jumbo shrimp', 'Blue sky', 'Fast car'], answer: 1 },
      { q: "'She sells seashells' is an example of:", options: ['Metaphor', 'Alliteration', 'Hyperbole', 'Irony'], answer: 1 },
      { q: "What is the root word of 'unbelievable'?", options: ['Un', 'Believe', 'Able', 'Unbelieve'], answer: 1 },
      { q: "Which word uses a prefix meaning 'against'?", options: ['Preview', 'Antibiotic', 'Submarine', 'Rewrite'], answer: 1 },
      { q: "What figure of speech is 'as brave as a lion'?", options: ['Metaphor', 'Simile', 'Hyperbole', 'Irony'], answer: 1 },
      { q: "What is the subject of 'Running is fun'?", options: ['Running', 'Is', 'Fun', 'None'], answer: 0 },
    ],
  },
  gk: {
    easy: [
      { q: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Rome'], answer: 2 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'Which animal is the tallest?', options: ['Elephant', 'Giraffe', 'Horse', 'Bear'], answer: 1 },
      { q: 'What color do you get mixing red and yellow?', options: ['Green', 'Purple', 'Orange', 'Brown'], answer: 2 },
      { q: 'Which instrument has 88 keys?', options: ['Guitar', 'Violin', 'Piano', 'Drums'], answer: 2 },
      { q: 'How many days are in a year?', options: ['360', '365', '370', '355'], answer: 1 },
      { q: 'How many colors are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'What is the largest mammal?', options: ['Elephant', 'Blue whale', 'Giraffe', 'Shark'], answer: 1 },
    ],
    medium: [
      { q: 'Who painted the Mona Lisa?', options: ['Picasso', 'Van Gogh', 'Da Vinci', 'Monet'], answer: 2 },
      { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
      { q: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
      { q: 'What is the hardest natural substance?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], answer: 2 },
      { q: 'Which country has the most people?', options: ['USA', 'India', 'China', 'Russia'], answer: 1 },
      { q: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'Malta', 'Luxembourg'], answer: 1 },
      { q: 'Which country gifted the Statue of Liberty to the USA?', options: ['UK', 'France', 'Spain', 'Italy'], answer: 1 },
      { q: 'What is the tallest mountain in the world?', options: ['K2', 'Everest', 'Kilimanjaro', 'Denali'], answer: 1 },
    ],
    hard: [
      { q: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 1 },
      { q: "Who wrote 'Romeo and Juliet'?", options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], answer: 1 },
      { q: 'What does DNA stand for?', options: ['Deoxyribonucleic Acid', 'Dinitrogen Acid', 'Dynamic Nuclear Atom', 'Double Nucleus Acid'], answer: 0 },
      { q: 'Which civilization built Machu Picchu?', options: ['Maya', 'Aztec', 'Inca', 'Roman'], answer: 2 },
      { q: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], answer: 2 },
      { q: 'How many time zones does Russia span?', options: ['7', '9', '11', '13'], answer: 2 },
      { q: 'Who was the first person to walk on the Moon?', options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'], answer: 2 },
      { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 2 },
    ],
  },
};
