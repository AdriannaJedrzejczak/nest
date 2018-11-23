export class CreateCatInput {
    name: string;
    age?: number;
    owners: string[];
    cool?: boolean;
}

export class Cat {
    id?: number;
    name: string;
    age?: number;
    owners?: Person[];
    cool?: boolean;
}

export abstract class IMutation {
    abstract createCat(createCatInput?: CreateCatInput): Cat | Promise<Cat>;

    abstract setCool(id: string): boolean | Promise<boolean>;
}

export class Person {
    id?: number;
    catId: number;
    name: string;
    cool?: boolean;
}

export abstract class IQuery {
    abstract getCats(): Cat[] | Promise<Cat[]>;

    abstract getCat(id: string): Cat | Promise<Cat>;

    abstract temp__(): boolean | Promise<boolean>;
}

export abstract class ISubscription {
    abstract catChanged(): Cat | Promise<Cat>;

    abstract personChanged(): Person | Promise<Person>;

    abstract coolChanged(): Cool | Promise<Cool>;
}

export type Cool = Cat | Person;
