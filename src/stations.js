export const STATIONS = [
{ id: 0, name: 'Пресс', title: 'Пресс-форма', img: '/Картинки/Пресс-форма.jpg', output: 'пластик', rate: 1, inputs: [] },
  { id: 1, name: 'Литейка', title: 'Литейный цех', img: '/Картинки/Литейный цех.jpg', output: 'сталь', rate: 1, inputs: [] },
  { id: 2, name: 'Резчик', title: 'Резчик деталей', img: '/Картинки/Резчик деталей.jpg', output: 'детали', rate: 1, inputs: ['пластик', 'сталь'] },
  { id: 3, name: 'Обшив.', title: 'Сборщик обшивки', img: '/Картинки/Сборщик обшивки.jpg', output: 'обшивка', rate: 1, inputs: ['пластик', 'детали'] },
  { id: 4, name: 'Каркас.', title: 'Сборщик каркасов', img: '/Картинки/Сборщик каркасов.jpg', output: 'каркас', rate: 1, inputs: ['сталь', 'детали'] },
  { id: 5, name: 'Авто', title: 'Сборщик Авто', img: '/Картинки/Сбощик авто.jpg', output: 'авто', rate: 1, inputs: ['детали', 'обшивка', 'каркас'] },
  { id: 6, name: 'Ремонт', title: 'Ремонт', img: '', output: '', rate: 1, inputs: [] }
];

