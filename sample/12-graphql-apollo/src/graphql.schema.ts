export class CreateCatInput {
    name: string;
    age?: number;
    owners: string[];
}

export class Cat {
    id?: number;
    name: string;
    age?: number;
    owners?: Person[];
}

export abstract class IMutation {
    abstract createCat(createCatInput?: CreateCatInput): Cat | Promise<Cat>;
}

export class Person {
    id?: number;
    catId: number;
    name: string;
}

export abstract class IQuery {
    abstract getCats(): Cat[] | Promise<Cat[]>;

    abstract cat(id: string): Cat | Promise<Cat>;

    abstract temp__(): boolean | Promise<boolean>;
}

export abstract class ISubscription {
    abstract catCreated(): Cat | Promise<Cat>;

    abstract personCreated(): Person | Promise<Person>;
}
