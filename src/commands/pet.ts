import fs from "fs";
import os from "os";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import ansiEscapes from "ansi-escapes";

import { PETS, type PetType } from "../pets/index.js";

const PET_FILE = path.join(os.homedir(), ".codebrain", "pet.json");
type PetState = "idle" | "eating" | "playing" | "sleeping";

type Pet = {
    name: string, 
    species: PetType;
    level: number;
    xp: number;
    hunger: number;
    happiness: number;
    energy: number;
    state: PetState;
};

function savePet(pet: Pet){
    fs.mkdirSync(path.dirname(PET_FILE), {recursive: true});
    fs.writeFileSync(PET_FILE, JSON.stringify(pet, null, 2));
}

function loadPet(): Pet | null {
    if (!fs.existsSync(PET_FILE)) return null;

    return JSON.parse(fs.readFileSync(PET_FILE, "utf8"));
}

function getPetMaxHeight(species: PetType): number {
    const petDef = PETS[species];
    let max = 0;
    for (const state of Object.values(petDef)) {
        for (const frame of state as string[]) {
            const linesCount = frame.split('\n').length;
            if (linesCount > max) max = linesCount;
        }
    }
    return max;
}

function renderPetUI(pet: Pet, frame: string) {
    console.clear();
    const maxHeight = getPetMaxHeight(pet.species);
    const lines = frame.split('\n');
    while (lines.length < maxHeight) {
        lines.push('');
    }
    const paddedFrame = lines.join('\n');
    console.log(chalk.cyan(paddedFrame));
    console.log();
    console.log(`${chalk.bold(pet.name)} | Lvl: ${pet.level} | XP: ${pet.xp}/100`);
    console.log(`🍖 ${pet.hunger}% | 😊 ${pet.happiness}% | ⚡ ${pet.energy}%`);
    console.log();
}

function updatePetFrame(pet: Pet, frame: string) {
    const maxHeight = getPetMaxHeight(pet.species);
    const lines = frame.split('\n');
    while (lines.length < maxHeight) {
        lines.push('');
    }
    const paddedFrame = lines.map(line => line + '\x1B[K').join('\r\n');
    
    process.stdout.write(
        ansiEscapes.cursorSavePosition +
        ansiEscapes.cursorTo(0, 0) +
        chalk.cyan(paddedFrame) +
        ansiEscapes.cursorRestorePosition
    );
}

async function playAnimation(pet: Pet, frames: string[], speed = 350, repeat = 1, waitAtEnd = 1000){
    if (frames.length === 0) {
        return;
    }
    for(let i = 0; i < repeat; i++) {
        for (const frame of frames){
            renderPetUI(pet, frame);
            await new Promise (r => setTimeout(r, speed));
        }
    }
    if (waitAtEnd > 0) {
        await new Promise (r => setTimeout(r, waitAtEnd));
    }
}

async function createPet(): Promise<Pet> {
    console.clear();
    console.log(chalk.cyan.bold("🐾 Welcome to Codebrain Pet! \n"));
    const { species }: {species: PetType} = await inquirer.prompt([
        {
            type: "list",
            name: "species",
            message: "Choose your companion:",
            choices: [
                { name: "🐶 Dog", value: "dog" },
                { name: "🐱 Cat", value: "cat" },
                { name: "🐰 Rabbit", value: "rabbit" },
                { name: "🦊 Fox", value: "fox" },
                { name: "🐧 Penguin", value: "penguin" },
                { name: "🐉 Dragon", value: "dragon" }
            ]
        }
    ]);
    console.clear();
    console.log(chalk.green(PETS[species].idle[0] || ""));
    console.log();

    const { name } = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Give your companion a name: ",
            default: "Buddy"
        }
    ]);

    const pet: Pet = {
        name, 
        species,
        level: 0,
        xp: 0,
        hunger: 100,
        happiness: 100,
        energy: 100,
        state: "idle"
    };

    savePet(pet);
    console.clear();

    console.log(chalk.green("✨ Your companion is ready!\n"));
    console.log(chalk.cyan(PETS[species].idle[0] || ""));
    console.log(chalk.bold(name));

    await inquirer.prompt([
        {
            type: "input",
            name: "-",
            message: "Press Enter..."
        }
    ]);
    return pet;
}

export async function petCommand(): Promise<void> {
    let pet = loadPet();

    if(!pet){
        pet = await createPet();
    }

    while(true){
        renderPetUI(pet, PETS[pet.species].idle[0] || "");

        let frameIndex = 0;
        const idleFrames = PETS[pet.species].idle;
        const animationInterval = setInterval(() => {
            frameIndex = (frameIndex + 1) % idleFrames.length;
            updatePetFrame(pet, idleFrames[frameIndex]);
        }, 500);

        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "What do you want to do?",
                choices: [
                    "Feed",
                    "Play",
                    "Sleep",
                    "Rename",
                    "Change Animal",
                    "Back"
                ]
            }
        ]);

        clearInterval(animationInterval);

        switch(action){
            case "Feed":
                pet.state = "eating";
                await playAnimation(pet, PETS[pet.species].eating);

                pet.hunger = Math.min(100, pet.hunger + 20);

                pet.state = "idle";
                break;
            case "Play":
                pet.state = "playing";
                await playAnimation(pet, PETS[pet.species].playing);

                pet.happiness = Math.min(100, pet.happiness + 20);
                pet.energy = Math.max(0, pet.energy - 10);

                pet.state = "idle";
                break;
            case "Sleep":
                pet.state = "sleeping";
                await playAnimation(pet, PETS[pet.species].sleeping, 400);

                pet.energy = Math.min(100, pet.energy + 25);

                pet.state = "idle";
                break;
            case "Rename": {
                const { name } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "name",
                        message: "New Name: ",
                        default: pet.name
                    }
                ]);
                pet.name = name;
                break;
            }
            case "Change Animal": {
                const { species } = await inquirer.prompt([
                    {
                        type: "list",
                        name: "species",
                        message: "Choose a new animal: ",
                        choices: [
                            { name: "🐶 Dog", value: "dog" },
                            { name: "🐱 Cat", value: "cat" },
                            { name: "🐰 Rabbit", value: "rabbit" },
                            { name: "🦊 Fox", value: "fox" },
                            { name: "🐧 Penguin", value: "penguin" },
                            { name: "🐉 Dragon", value: "dragon" }
                        ]
                    }
                ]);
                pet.species = species;
                break;
            }
            case "Back":
                savePet(pet);
                return;
        }
        savePet(pet);
    }
}