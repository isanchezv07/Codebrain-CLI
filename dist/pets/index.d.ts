export declare const PETS: {
    readonly dog: {
        idle: string[];
        eating: string[];
        playing: string[];
        sleeping: string[];
    };
    readonly cat: {
        idle: string[];
        eating: string[];
        playing: never[];
        sleeping: string[];
    };
    readonly rabbit: {
        idle: string[];
        eating: string[];
        playing: string[];
        sleeping: string[];
    };
    readonly fox: {
        idle: string[];
        eating: string[];
        playing: string[];
        sleeping: string[];
    };
    readonly penguin: {
        idle: string[];
        eating: never[];
        playing: never[];
        sleeping: never[];
    };
    readonly dragon: {
        idle: string[];
        eating: string[];
        playing: string[];
        sleeping: string[];
    };
};
export type PetType = keyof typeof PETS;
