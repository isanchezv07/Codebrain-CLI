import fs from "fs";
import os from "os";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { PETS } from "../pets/index.js";
const PET_FILE = path.join(os.homedir(), ".codebrain", "pet.json");
function savePet(pet) {
    fs.mkdirSync(path.dirname(PET_FILE), { recursive: true });
    fs.writeFileSync(PET_FILE, JSON.stringify(pet, null, 2));
}
function loadPet() {
    if (!fs.existsSync(PET_FILE))
        return null;
    return JSON.parse(fs.readFileSync(PET_FILE, "utf8"));
}
async function playAnimation(frames, speed = 200) {
    for (const frame of frames) {
        process.stdout.write("\x1b[2J\x1b[H");
        console.log(frame);
        await new Promise(r => setTimeout(r, speed));
    }
}
async function createPet() {
    console.clear();
    console.log(chalk.cyan.bold("🐾 Welcome to Codebrain Pet! \n"));
    const { species } = await inquirer.prompt([
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
    console.log(chalk.green(PETS[species].idle[0]));
    console.log();
    const { name } = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Give your companion a name: ",
            default: "Buddy"
        }
    ]);
    const pet = {
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
    console.log(chalk.cyan(PETS[species].idle[0]));
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
export async function petCommand() {
    let pet = loadPet();
    if (!pet) {
        pet = await createPet();
    }
    while (true) {
        console.clear();
        console.log(chalk.cyan(PETS[pet.species]));
        console.log(chalk.bold(`${pet.name}`));
        console.log(`Level ${pet.level}`);
        console.log(`XP ${pet.xp}/100`);
        console.log();
        console.log(`🍖 Hunger    ${pet.hunger}%`);
        console.log(`😊 Happiness ${pet.happiness}%`);
        console.log(`⚡ Energy    ${pet.energy}%`);
        console.log();
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
        switch (action) {
            case "Feed":
                pet.state = "eating";
                await playAnimation(PETS[pet.species].eating);
                pet.hunger = Math.min(100, pet.hunger + 20);
                pet.state = "idle";
                break;
            case "Play":
                pet.state = "playing";
                await playAnimation(PETS[pet.species].playing);
                pet.happiness = Math.min(100, pet.happiness + 20);
                pet.energy = Math.max(0, pet.energy - 10);
                pet.state = "idle";
                break;
            case "Sleep":
                pet.state = "sleeping";
                await playAnimation(PETS[pet.species].sleeping, 400);
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
                break;
        }
        savePet(pet);
    }
}
