'use strict';
/* Static data: muscle groups, specific muscles, workout types, starter exercise library. */

const GROUPS = [
  { id: 'chest', name: 'Chest', color: '#FF3B4E' },
  { id: 'back', name: 'Back', color: '#1E9BF0' },
  { id: 'shoulders', name: 'Shoulders', color: '#FF9F0A' },
  { id: 'arms', name: 'Arms', color: '#A55EEA' },
  { id: 'legs', name: 'Legs', color: '#12B886' },
  { id: 'abs', name: 'Abs', color: '#0FB5C6' },
];
// Clockwise from the top of the hexagon, so opposing muscles sit across from each other.
const RADAR_ORDER = ['chest', 'shoulders', 'arms', 'abs', 'legs', 'back'];

// hide: true -> hidden from the muscles hexagon by default (still trackable everywhere else)
const MUSCLES = [
  { id: 'upperchest', name: 'Upper Chest', g: 'chest' },
  { id: 'midchest', name: 'Mid Chest', g: 'chest' },
  { id: 'lowerchest', name: 'Lower Chest', g: 'chest' },
  { id: 'lats', name: 'Lats', g: 'back' },
  { id: 'upperback', name: 'Upper Back', g: 'back' },
  { id: 'traps', name: 'Traps', g: 'back' },
  { id: 'lowerback', name: 'Lower Back', g: 'back' },
  { id: 'neck', name: 'Neck', g: 'back', hide: true },
  { id: 'frontdelts', name: 'Front Delts', g: 'shoulders' },
  { id: 'sidedelts', name: 'Side Delts', g: 'shoulders' },
  { id: 'reardelts', name: 'Rear Delts', g: 'shoulders' },
  { id: 'biceps', name: 'Biceps', g: 'arms' },
  { id: 'triceps', name: 'Triceps', g: 'arms' },
  { id: 'forearms', name: 'Forearms', g: 'arms', hide: true },
  { id: 'quads', name: 'Quads', g: 'legs' },
  { id: 'hamstrings', name: 'Hamstrings', g: 'legs' },
  { id: 'glutes', name: 'Glutes', g: 'legs' },
  { id: 'calves', name: 'Calves', g: 'legs' },
  { id: 'adductors', name: 'Adductors', g: 'legs', hide: true },
  { id: 'abductors', name: 'Abductors', g: 'legs', hide: true },
  { id: 'absm', name: 'Abs', g: 'abs' },
  { id: 'obliques', name: 'Obliques', g: 'abs' },
];

const TYPES = [
  { id: 'full', name: 'Full Body', color: 'var(--inkcard)', groups: ['chest', 'back', 'shoulders', 'arms', 'legs', 'abs'] },
  { id: 'upper', name: 'Upper', color: '#5E5CE6', groups: ['chest', 'back', 'shoulders', 'arms'] },
  { id: 'lower', name: 'Lower', color: '#0B8F69', groups: ['legs', 'abs'] },
  { id: 'push', name: 'Push', color: '#FF6B3D', groups: ['chest', 'shoulders'], muscles: ['triceps'] },
  { id: 'pull', name: 'Pull', color: '#2F6BFF', groups: ['back'], muscles: ['biceps'] },
  { id: 'legs', name: 'Legs', color: '#12B886', groups: ['legs'] },
  { id: 'arms', name: 'Arms', color: '#A55EEA', groups: ['arms'] },
  { id: 'chest', name: 'Chest', color: '#FF3B4E', groups: ['chest'] },
  { id: 'back', name: 'Back', color: '#1E9BF0', groups: ['back'] },
  { id: 'shoulders', name: 'Shoulders', color: '#FF9F0A', groups: ['shoulders'] },
  { id: 'abs', name: 'Abs', color: '#0FB5C6', groups: ['abs'] },
];

// Exercise classes: kind (w = weights, bw = bodyweight + added load), default rep range, increment in kg
const CLASSES = {
  c: { kind: 'w', min: 6, max: 10, inc: 2.5 },   // barbell compound
  m: { kind: 'w', min: 8, max: 12, inc: 2.5 },   // machine / cable
  d: { kind: 'w', min: 8, max: 12, inc: 2 },     // dumbbell
  i: { kind: 'w', min: 10, max: 15, inc: 2.5 },  // isolation
  b: { kind: 'bw', min: 6, max: 12, inc: 2.5 },  // bodyweight compound
  a: { kind: 'bw', min: 10, max: 20, inc: 2.5 }, // bodyweight core / small
};

// [name, muscle, standard, class]
// standard = approx. "intermediate" male strength for one rep, as a multiple of bodyweight
// (per dumbbell for dumbbell lifts, total load for bodyweight lifts). 0 = no standard: scored on personal progress.
const LIBRARY = [
  ['Barbell Bench Press', 'midchest', 1.2, 'c'],
  ['Dumbbell Bench Press', 'midchest', 0.45, 'd'],
  ['Machine Chest Press', 'midchest', 1.1, 'm'],
  ['Cable Fly', 'midchest', 0, 'i'],
  ['Pec Deck', 'midchest', 0, 'i'],
  ['Push-Up', 'midchest', 0, 'a'],
  ['Incline Barbell Bench Press', 'upperchest', 1.0, 'c'],
  ['Incline Dumbbell Press', 'upperchest', 0.38, 'd'],
  ['Low-to-High Cable Fly', 'upperchest', 0, 'i'],
  ['Decline Bench Press', 'lowerchest', 1.25, 'c'],
  ['Chest Dip', 'lowerchest', 1.5, 'b'],
  ['High-to-Low Cable Fly', 'lowerchest', 0, 'i'],
  ['Pull-Up', 'lats', 1.4, 'b'],
  ['Chin-Up', 'lats', 1.45, 'b'],
  ['Lat Pulldown', 'lats', 0.95, 'm'],
  ['Straight-Arm Pulldown', 'lats', 0, 'i'],
  ['Barbell Row', 'upperback', 1.0, 'c'],
  ['Seated Cable Row', 'upperback', 1.0, 'm'],
  ['Dumbbell Row', 'upperback', 0.5, 'd'],
  ['Chest-Supported T-Bar Row', 'upperback', 0.9, 'm'],
  ['Barbell Shrug', 'traps', 1.5, 'c'],
  ['Dumbbell Shrug', 'traps', 0.6, 'd'],
  ['Deadlift', 'lowerback', 1.8, 'c'],
  ['Back Extension', 'lowerback', 0, 'a'],
  ['Plate Neck Curl', 'neck', 0, 'i'],
  ['Plate Neck Extension', 'neck', 0, 'i'],
  ['Overhead Press', 'frontdelts', 0.75, 'c'],
  ['Seated Dumbbell Shoulder Press', 'frontdelts', 0.32, 'd'],
  ['Front Raise', 'frontdelts', 0, 'i'],
  ['Dumbbell Lateral Raise', 'sidedelts', 0.15, 'i'],
  ['Cable Lateral Raise', 'sidedelts', 0, 'i'],
  ['Machine Lateral Raise', 'sidedelts', 0, 'i'],
  ['Face Pull', 'reardelts', 0, 'i'],
  ['Reverse Pec Deck', 'reardelts', 0, 'i'],
  ['Rear Delt Dumbbell Fly', 'reardelts', 0, 'i'],
  ['Barbell Curl', 'biceps', 0.55, 'm'],
  ['Dumbbell Curl', 'biceps', 0.25, 'd'],
  ['Hammer Curl', 'biceps', 0.27, 'd'],
  ['Preacher Curl', 'biceps', 0.45, 'm'],
  ['Cable Curl', 'biceps', 0, 'i'],
  ['Tricep Pushdown', 'triceps', 0.6, 'm'],
  ['Skull Crusher', 'triceps', 0.5, 'm'],
  ['Overhead Cable Extension', 'triceps', 0, 'i'],
  ['Close-Grip Bench Press', 'triceps', 1.0, 'c'],
  ['Wrist Curl', 'forearms', 0, 'i'],
  ['Reverse Wrist Curl', 'forearms', 0, 'i'],
  ["Farmer's Carry", 'forearms', 0, 'd'],
  ['Back Squat', 'quads', 1.5, 'c'],
  ['Front Squat', 'quads', 1.2, 'c'],
  ['Hack Squat', 'quads', 1.8, 'm'],
  ['Leg Press', 'quads', 2.8, 'm'],
  ['Leg Extension', 'quads', 0.9, 'i'],
  ['Bulgarian Split Squat', 'quads', 0, 'd'],
  ['Romanian Deadlift', 'hamstrings', 1.4, 'c'],
  ['Lying Leg Curl', 'hamstrings', 0.7, 'i'],
  ['Seated Leg Curl', 'hamstrings', 0.75, 'i'],
  ['Hip Thrust', 'glutes', 1.7, 'c'],
  ['Cable Glute Kickback', 'glutes', 0, 'i'],
  ['Standing Calf Raise', 'calves', 1.5, 'i'],
  ['Seated Calf Raise', 'calves', 1.0, 'i'],
  ['Hip Adduction Machine', 'adductors', 0, 'i'],
  ['Hip Abduction Machine', 'abductors', 0, 'i'],
  ['Cable Crunch', 'absm', 0, 'i'],
  ['Hanging Leg Raise', 'absm', 0, 'a'],
  ['Ab Wheel Rollout', 'absm', 0, 'a'],
  ['Crunch', 'absm', 0, 'a'],
  ['Cable Woodchopper', 'obliques', 0, 'i'],
  ['Russian Twist', 'obliques', 0, 'a'],
];

// For the "total weight moved" fun fact: [singular, plural, kg]
const THINGS = [
  ['grand piano', 'grand pianos', 400],
  ['car', 'cars', 1500],
  ['elephant', 'elephants', 6000],
  ['T. rex', 'T. rexes', 8000],
  ['blue whale', 'blue whales', 150000],
  ['Boeing 747', 'Boeing 747s', 400000],
  ['Eiffel Tower', 'Eiffel Towers', 7300000],
];
