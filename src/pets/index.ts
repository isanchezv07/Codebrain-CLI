import dog from "./dog.js";
import cat from "./cat.js";
import rabbit from "./rabbit.js";
import fox from "./fox.js";
import penguin from "./penguin.js";
import dragon from "./dragon.js";

export const PETS = {
  dog,
  cat,
  rabbit,
  fox,
  penguin,
  dragon,
} as const;

export type PetType = keyof typeof PETS;