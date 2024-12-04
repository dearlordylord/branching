// this is a reference to how the topic of matching relates to visitor pattern

// normal oop:

// entities
interface Animal {
  // behaviours
  getSound(): string;

  // canClimbTrees(): boolean;
}

class Dog implements Animal {
  woof(): string {
    return 'woof';
  }

  getSound(): string {
    return this.woof();
  }

  //
  // canClimbTrees(): boolean {
  //   return false;
  // }
}

class Cat implements Animal {
  meow(): string {
    return 'meow';
  }

  getSound(): string {
    return this.meow();
  }

  // canClimbTrees(): boolean {
  //   return true;
  // }
}

// easier to add an entity, more difficult to add a behaviour ^

// visitor pattern
// https://refactoring.guru/design-patterns/visitor/typescript/example
// "Visitor isn’t a very common pattern because of its complexity and narrow applicability."

interface AnimalVisitor<R> {
  visitDog(dog: Dog2): R;

  visitCat(cat: Cat2): R;
}

interface Animal2 {
  accept<R>(visitor: AnimalVisitor<R>): R;
}

class Dog2 implements Animal2 {
  woof(): string {
    return 'woof';
  }

  accept<R>(visitor: AnimalVisitor<R>): R {
    return visitor.visitDog(this);
  }
}

class Cat2 implements Animal2 {
  meow(): string {
    return 'meow';
  }

  accept<R>(visitor: AnimalVisitor<R>): R {
    return visitor.visitCat(this);
  }
}

class MakeSoundVisitor implements AnimalVisitor<string> {
  visitDog(dog: Dog2): string {
    return dog.woof();
  }

  visitCat(cat: Cat2): string {
    return cat.meow();
  }
}

class CanClimbTreesVisitor implements AnimalVisitor<boolean> {
  visitDog(dog: Dog2): boolean {
    // we roll back to interface behaviour if we do it this way:
    // return dog.canClimbTrees();
    // but it knows about dog structure anyways so...
    return false;
  }

  visitCat(cat: Cat2): boolean {
    return true;
  }
}

// easier to add a behaviour, more difficult to add an entity ^
// visitor is an exhaustive match, for classes, done in a very intrusive way

const makeSound = (animal: Animal2): string => {
  if (animal instanceof Dog2) {
    return animal.woof();
  } else if (animal instanceof Cat2) {
    return animal.meow();
  }
  // can't make it exhaustive, and shouldn't we be able to, really? it's our code, we know all the animals
  throw new Error('animal is not a dog or cat');
};

const canClimbTrees = (animal: Animal2): boolean => {
  if (animal instanceof Dog2) {
    return false;
  } else if (animal instanceof Cat2) {
    return true;
  }
  throw new Error('animal is not a dog or cat');
};

// it's just a decades-old question of behaviour + entities combinatorics