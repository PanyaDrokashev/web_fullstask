export interface ICatalogColors {
  tag: string;
}

export interface ICatalogSize {
  length: number;
  width: number;
  height: number;
}

export interface ICatalogItem {
  id: number;
  tag?: string; // Тротуарная плитка
  title: string; // название
  dir: string; // директория с картинками
  img: string; // путь к картинке
  sliderImages: string[]; // изображения к слайдеру
  price: Record<string, number>; // цены по цветам (цвет: цена)
  priceTag: string; // ед измерения (м^2)
  withBtn?: boolean;
  colors: ICatalogColors[]; // цвета
  sizes: ICatalogSize[]; // размеры (длина, ширина, высота)
  description: string[]; // описание
  isAvailable: boolean; // доступно ли
  onPallet: number; // сколько помещается на 1 поддоне
  weight: number; // вес 1 м^2
}


const COLOR_BLACK: ICatalogColors = {
  tag: "Черный",
};

const COLOR_ORANGE: ICatalogColors = {
  tag: "Оранжевый",
};

const COLOR_WHITE: ICatalogColors = {
  tag: "Белый",
};

const COLOR_YELLOW: ICatalogColors = {
  tag: "Желтый",
};

const COLOR_MIX: ICatalogColors = {
  tag: "Колор-микс",
};

const COLOR_BROWN: ICatalogColors = {
  tag: "Коричневый",
}

const COLOR_RED: ICatalogColors = {
  tag: "Красный",
}

const COLOR_GRAY: ICatalogColors = {
  tag: "Серый",
}

export const catalogItems: ICatalogItem[] = [
  {
    id: 1,
    tag: "Тротуарная плитка",
    title: "Серия «Кирпичик»",
    dir: "kirpichik",
    img: "",
    sliderImages: [],
    price: {
      Серый: 850,
      Коричневый: 900,
      Красный: 950,
      Черный: 900,
      Оранжевый: 950,
      Белый: 950,
      Желтый: 950,
      "Колор-микс": 1250,
    },
    priceTag: "м2",
    colors: [COLOR_BLACK, COLOR_ORANGE, COLOR_YELLOW, COLOR_WHITE, COLOR_BROWN, COLOR_GRAY, COLOR_RED, COLOR_MIX],
    sizes: [
      {
        length: 200,
        width: 100,
        height: 40,
      },
    ],
    description: [
      "«Кирпичик» — одна из самых востребованных форм тротуарных плит в нашем ассортименте благодаря простой геометрии и множеству вариантов размеров.",
      "Эта плитка идеально подходит для создания как классических, так и современных мощений, обеспечивая вариативность укладки и дизайн.",
      "Благодаря разнообразию параметров и широкой цветовой гамме, плиты серии «Кирпичик» применимы для благоустройства частных участков, общественных территорий, садов и парков."
    ],
    isAvailable: true,
    onPallet: 20.16,
    weight: 85,
  },
  {
    id: 2,
    tag: "Тротуарная плитка",
    title: "Серия «Старый город»",
    dir: "oldcity",
    img: "",
    sliderImages: [],
    price: {
      Серый: 850,
      Коричневый: 900,
      Красный: 950,
      Черный: 900,
      Оранжевый: 950,
      Белый: 950,
      Желтый: 950,
      "Колор-микс": 1250,
    },
    priceTag: "м2",
    colors: [COLOR_BLACK, COLOR_ORANGE, COLOR_YELLOW, COLOR_WHITE, COLOR_BROWN, COLOR_GRAY, COLOR_RED, COLOR_MIX],
    sizes: [
      {
        length: 180,
        width: 120,
        height: 40,
      },
      {
        length: 120,
        width: 120,
        height: 40,
      },
      {
        length: 90,
        width: 120,
        height: 40,
      },
    ],
    description: [
      "Тротуарная плитка «Старый город» станет прекрасным выбором для воплощения изысканных дизайн-проектов, в которых присутствуют замысловатые узоры, круговые элементы или крупные геометрические формы.",
      "Фигурные элементы мощения формы «Старый город» сделают приусадебный участок особенным, благодаря уникальной комплектности изделий. Разнообразьте выкладку плитками квадратной, прямоугольной и трапециевидной форм, а плавная фаска и закругленные края этого тротуарного покрытия придадут территории, мощеной плиткой «Старый город» особую атмосферу уюта.",
      "Это универсальный инструмент для создания прочных и художественно привлекательных поверхностей. Многообразие цветовых и фактурных решений тротуарного покрытия «Старый город» позволяет использовать его в проектах различных архитектурных стилей.",
    ],
    isAvailable: true,
    onPallet: 20.16,
    weight: 85.7,
  },
  {
    id: 3,
    tag: "Тротуарная плитка",
    title: "Серия «Мюнхен»",
    dir: "munich",
    img: "",
    sliderImages: [],
    price: {
      Серый: 900,
      Коричневый: 950,
      Красный: 1000,
      Черный: 950,
      Оранжевый: 1000,
      Белый: 1000,
      Желтый: 1000,
      "Колор-микс": 1350,
    },
    priceTag: "м2",
    colors: [COLOR_BLACK, COLOR_ORANGE, COLOR_YELLOW, COLOR_WHITE, COLOR_BROWN, COLOR_GRAY, COLOR_RED, COLOR_MIX],
    sizes: [
      {
        length: 280,
        width: 210,
        height: 40,
      },
      {
        length: 140,
        width: 210,
        height: 40,
      },
      {
        length: 140,
        width: 140,
        height: 40,
      },
    ],
    description: [
      "Форма плит «Мюнхен» вдохновлена красотой старинной Европы — мощеные улочки, уютные дома и зелень плюща. Эта серия отлично подойдет для создания аристократичного, классического ландшафта в частных садах и дворах.",
      "«Мюнхен» представлен во всех основных цветах и коллекциях, что позволяет использовать его в самых разных архитектурных стилях, придавая территории благородный и элегантный вид."
    ],
    isAvailable: true,
    onPallet: 20.14,
    weight: 84.1,
  },
  {
    id: 4,
    title: "Бордюр",
    dir: "bordure",
    img: "/catalog/bordure.png",
    sliderImages: [],
    price: {
      Серый: 200,
      Коричневый: 215,
      Красный: 230,
      Черный: 215,
      Оранжевый: 230,
      Белый: 230,
      Желтый: 230,
      "Колор-микс": 250,
    },
    priceTag: "шт.",
    colors: [COLOR_BLACK, COLOR_ORANGE, COLOR_YELLOW, COLOR_WHITE, COLOR_BROWN, COLOR_GRAY, COLOR_RED, COLOR_MIX],
    sizes: [
      {
        length: 500,
        width: 200,
        height: 60,
      },
    ],
    description: [
      "Бордюры — неотъемлемая часть благоустройства улиц, дворов и общественных пространств. Они отделяют пешеходные зоны от газонов, защищают покрытие от грязи и воды, а также предотвращают механические повреждения краев мощения.",
      "Бордюры облегчают уборку территории и продлевают срок службы тротуарной плитки и асфальта. Выполнены в тех же цветах и стилистике, что и плитка, что позволяет гармонично завершить дизайн любой мощеной поверхности."
    ],
    isAvailable: true,
    onPallet: 10,
    weight: 1.25,
  },
];
